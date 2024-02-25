import Web3 from 'web3'
import type { Abi } from 'constants/types'
import { ContractRawCall } from 'constants/'
import Multicall3 from 'abis/multicall/Multicall3.json'
import { Contract, ContractSendMethod } from 'web3-eth-contract'
import { splitArrayIntoChunks, hashCode, asyncWait, callWithTimeout, isEmpty } from 'helpers/'

type Param = any

const MULTICALL_TIMEOUT = 15000

export type CallData = {
  args: Param[]
  target: string
  method: string
  batchId: number
  extraData: object
  returnTypes: string[]
  returnFields: string[]
  rawCall: ContractSendMethod
}

export type CachedRequest = {
  status: 'pending' | 'success' | 'error'
  data: DecodedResult[] | null
}

export type DecodedResult = {
  data:any,
  callData: CallData,
  extraData: Record<string, any>
}

export type BatchesResults = Record<number, DecodedResult[]>

export class  Multicall {

  readonly web3: Web3
  readonly chainId: number
  readonly maxBatchSize: number
  readonly networkContract: string
  readonly multicallContract: Contract
  public cachedRequests: Record<string, CachedRequest>

  constructor(chainId: number, web3: Web3) {
    this.web3 = web3
    this.chainId = chainId
    this.maxBatchSize = 600
    this.cachedRequests = {}
    this.networkContract = '0xcA11bde05977b3631167028862bE2a173976CA11'
    this.multicallContract = new web3.eth.Contract(Multicall3 as Abi, this.networkContract)
  }

  getCallsFromRawCalls(rawCalls: ContractRawCall[]): CallData[] {
    return rawCalls.reduce( (calls: CallData[], rawCall: ContractRawCall) => {
      const callData = this.getDataFromRawCall(rawCall.call, rawCall)
      if (callData){
        calls.push(callData)
      }
      return calls
    }, [])
  }

  getDataFromRawCall(rawCall: any, extraData: object = {}): CallData | null {
    if (!rawCall) return null
    const params = rawCall.arguments
    const contract = rawCall._parent
    const methodName = rawCall._method.name
    return this.getCallData(contract, methodName, params, extraData)
  }

  getCallData(contract: Contract, methodName: string, params: Param[] = [], extraData: object = {}): CallData | null {
    const methodAbi = contract.options.jsonInterface.find(f => f.name === methodName && f.inputs?.length === params.length);
    if (!methodAbi || !methodAbi.inputs || !methodAbi.outputs) return null

    const inputTypes = methodAbi.inputs.map( i => i.type );
    const returnTypes = methodAbi.outputs.map( i => i.type );
    const returnFields = methodAbi.outputs.map( i => i.name );

    if (contract.options.address === '0x0000000000000000000000000000000000000000') return null

    const checkAddress = (address: string) => {
      return address ? address.match(/^0x[a-fA-F0-9]{40}$/) !== null : false;
    }

    const args:Param[] = params.map( (p: Param,i: number):any => {
      const inputType = inputTypes[i];
      if (inputType === 'address' && !checkAddress(p as string)){
        p = '0x0000000000000000000000000000000000000000';
      }
      return [p].concat(inputType);
    });

    return {
      args,
      batchId:0,
      extraData,
      returnTypes,
      returnFields,
      target:contract.options.address,
      method:methodName+'('+inputTypes.join(',')+')',
      rawCall:contract.methods[methodName](...params)
    };
  }

  prepareMulticallData(calls: CallData[]): string | null {

    const strip0x = (str: string) => {
      return str.replace(/^0x/, '');
    }

    const values = [
      calls.map(({ target, method, args }) => {

        let decodedResult = ''
        try {
          decodedResult = (args && args.length > 0 ? strip0x(this.web3.eth.abi.encodeParameters(args.map(a => a[1]), args.map(a => a[0]))) : '')
        } catch (err) {
          // eslint-disable-next-line
          console.log('prepareMulticallData - ERROR', method, args, err)
        }

        return [
          target,
          1,
          this.web3.utils.keccak256(method).substr(0, 10) + decodedResult
        ];
      })
    ];
    const calldata = this.web3.eth.abi.encodeParameters(
      [
        {
          components: [{ type: 'address' }, {type: 'bool'}, { type: 'bytes' }],
          name: 'data',
          type: 'tuple[]'
        }
      ],
      values
    );

    // const methodSignature = this.web3.utils.keccak256('aggregate((address,bytes)[])').substr(0, 10)
    const methodSignature = this.web3.utils.keccak256('aggregate3((address,bool,bytes)[])').substr(0, 10)

    return methodSignature+strip0x(calldata);
  }

  async executeMultipleBatches(callBatches: CallData[][], chainId?: number, web3?: Web3): Promise<DecodedResult[][]> {
    // Assign batch Id to every call
    const calls = callBatches.reduce( (calls, batchedCalls, batchId) => {
      batchedCalls.forEach( call => {
        call.batchId = batchId;
        calls.push(call);
      });
      return calls;
    }, []);
      
    // Execute calls
    const results = await this.executeMulticalls(calls, true, chainId, web3);

    // Group by BatchID
    const output = Array.from(Array(callBatches.length).keys()).reduce( (output: BatchesResults, batchId: number) => {
      output[batchId] = results?.filter( call => call.callData.batchId === batchId ) || []
      return output
    }, {});

    return Object.values(output);

    /*
    return results ? Object.values(results.reduce( (output: BatchesResults, r) => {
      const batchId = r.callData.batchId;
      if (!output[batchId]){
        output[batchId] = [];
      }
      output[batchId].push(r);
      return output;
    },{})) : [];
    */
  }

  catchEm(promise: Promise<any>) {
    return promise.then(data => [null, data])
      .catch(err => [err, null]);
  }

  // Split multicall into smaller chunks and execute
  async executeMulticallsChunks(calls: CallData[], singleCallsEnabled = false, chainId?: number, web3?: Web3): Promise<DecodedResult[] | null> {
    const callsChunks = splitArrayIntoChunks(calls, this.maxBatchSize)
    const chunksResults = await Promise.all(callsChunks.map( chunk => this.executeMulticalls(chunk, singleCallsEnabled, chainId, web3) ))
    // console.log('chunksResults', callsChunks, chunksResults)
    return chunksResults.reduce( (results: DecodedResult[], chunkResults: any): DecodedResult[] => {
      // if (!chunkResults) return results
      return results.concat(...chunkResults)
    }, [])
  }

  async checkCachedRequests(hash: string, count: number = 1): Promise<DecodedResult[] | null> {
    if (this.cachedRequests[hash]) {
      const status = this.cachedRequests[hash].status
      if (status === 'pending'){
        if (count<=5){
          await asyncWait(100)
          return await this.checkCachedRequests(hash, count+1)
        } else {
          return null
        }
      } else if (status === 'success') {
        return this.cachedRequests[hash].data
      }
    }
    return null
  }

  async executeMulticalls(calls: CallData[], singleCallsEnabled = true, chainId?: number, web3?: Web3, debug: boolean = false): Promise<DecodedResult[] | null> {

    // Get chainId
    chainId = chainId || this.chainId
    web3 = web3 || this.web3

    if (isEmpty(calls)) return null

    if (calls.length > this.maxBatchSize) {
      return await this.executeMulticallsChunks(calls, singleCallsEnabled, chainId, web3)
    }

    const calldata = this.prepareMulticallData(calls);
    // console.log('callData', calldata)

    if (!calldata) return null

    // const multicallId = Date.now()

    const hash = hashCode(`${calldata}_${chainId}`)

    const cachedResults = await this.checkCachedRequests(hash);
    if (cachedResults){
      // console.warn('Multicall - TAKE CACHED DATA', hash, cachedResults)
      return cachedResults
    }

    this.cachedRequests[hash] = {
      status: 'pending',
      data: null
    }

    let results = null
    const contractAddress = this.networkContract;

    try {
      // @ts-ignore
      results = await callWithTimeout(() => web3.eth.call({
        data: calldata,
        to: contractAddress,
        from: contractAddress
      }), MULTICALL_TIMEOUT);
    } catch (err) {
      // eslint-disable-next-line
      // console.log(multicallId, 'Multicall Error:', chainId, calls, err, singleCallsEnabled)

      if (err === 'Timeout exceeded') return null

      if (!singleCallsEnabled) {
        this.cachedRequests[hash] = {
          status: 'error',
          data: null
        }
        return null
      }

      const callPromises = calls.map( call => this.catchEm(call.rawCall.call()))
      const decodedCalls = await this.catchEm(callWithTimeout(() => Promise.all(callPromises), MULTICALL_TIMEOUT))

      if (!!decodedCalls[0]){
        // console.log('Single calls failed', chainId, calls, decodedCalls[0])
        return null
      }

      const decodedData = decodedCalls[1].reduce( (decodedResults: any, decodedCall: any, i: number) => {
        const output = {
          data:null,
          callData:calls[i],
          extraData:calls[i].extraData
        };
        const [, result] = decodedCall

        if (result){
          output.data = result;
        }

        decodedResults.push(output)
        return decodedResults
      },[])

      this.cachedRequests[hash] = {
        status: 'success',
        data: decodedData
      }

      // console.log(multicallId, 'Multicall - Singlecalls: ', decodedData)
    }

    // console.log('Multicall', chainId, results)

    if (!results) return null

    const decodedResults = this.web3.eth.abi.decodeParameters(['(bool,bytes)[]'], results as string);
      
    // console.log(multicallId, 'Multicall - decodedResults', results, decodedResults)

    if (decodedResults && decodedResults[0].length){

      const decodedData = decodedResults[0].map( (callResult: any, index: number ) => {
        const success = callResult[0]
        const decodedResult = callResult[1]
        const output = {
          data:null,
          callData:calls[index],
          extraData:calls[index].extraData
        };

        if (!success) return output

        const returnTypes = calls[index].returnTypes;
        const returnFields = calls[index].returnFields;

        try {
          const decodedValues = Object.values(this.web3.eth.abi.decodeParameters(returnTypes, decodedResult));

          if (debug){
            // eslint-disable-next-line
            // console.log(returnTypes, returnFields, decodedResult, decodedValues)
          }

          if (returnTypes.length === 1){
            output.data = decodedValues[0];
          } else {
            const values = decodedValues.splice(0,returnTypes.length);
            output.data = values ? values.reduce( (acc, v, j) => {
              acc[j] = v;
              acc[returnFields[j]] = v;
              return acc;
            },{}) : {};
          }
        } catch (error) {
          // console.log('Decode error: ', error, calls[index], success, returnTypes, returnFields, decodedResult)
        }

        return output;
      });

      // console.log(multicallId, 'Multicall Decoded:', decodedData)

      this.cachedRequests[hash] = {
        status: 'success',
        data: decodedData
      }

      return decodedData
    }

    return null;
  }
}