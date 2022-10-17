import Web3 from 'web3'
import { Contract, ContractSendMethod } from 'web3-eth-contract'

type Param = any

export type CallData = {
  batchId: number
  args: Param[]
  extraData: object
  returnFields: string[]
  returnTypes: string[]
  target: string
  method: string
  rawCall: ContractSendMethod
}

export type DecodedResult = {
  data:string | number | null,
  callData:CallData,
  extraData: Record<string, any>
}

export type BatchesResults = Record<number, DecodedResult[]>

export class  Multicall {

  readonly web3: Web3
  readonly chainId: number
  readonly networksContracts: Record<number, string>

  constructor(chainId: number, web3: Web3) {
    this.networksContracts = {
      1:'0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
      137:'0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507'
    };
    
    this.web3 = web3
    this.chainId = chainId
  }

  getDataFromRawCall(rawCall: any, extraData: object = {}): CallData | null {
    const params = rawCall.arguments
    const contract = rawCall._parent
    const methodName = rawCall._method.name
    return this.getCallData(contract, methodName, params, extraData)
  }

  getCallData(contract: Contract, methodName: string, params: Param[], extraData: object = {}): CallData | null {
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
      calls.map(({ target, method, args, returnTypes }) => {
        return [
          target,
          this.web3.utils.keccak256(method).substr(0, 10) +
            (args && args.length > 0
              ? strip0x(this.web3.eth.abi.encodeParameters(args.map(a => a[1]), args.map(a => a[0])))
              : '')
        ];
      })
    ];
    const calldata = this.web3.eth.abi.encodeParameters(
      [
        {
          components: [{ type: 'address' }, { type: 'bytes' }],
          name: 'data',
          type: 'tuple[]'
        }
      ],
      values
    );

    return '0x252dba42'+strip0x(calldata);
  }

  async executeMultipleBatches(callBatches: CallData[][]): Promise<DecodedResult[][]> {
    // Assign batch Id to every call
    const calls = callBatches.reduce( (calls, batchedCalls, batchId) => {
      batchedCalls.forEach( call => {
        call.batchId = batchId;
        calls.push(call);
      });
      return calls;
    }, []);
      
    // Execute calls
    const results = await this.executeMulticalls(calls);

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
    return promise.then(data => [null,data])
      .catch(err => [err,null]);
  }

  async executeMulticalls(calls: CallData[]): Promise<DecodedResult[] | null> {

    const calldata = this.prepareMulticallData(calls);

    if (!calldata) return null;

    const contractAddress = this.networksContracts[this.chainId];

    try {
      const results = await this.web3.eth.call({
        data: calldata,
        to: contractAddress
      });

      const decodedParams = this.web3.eth.abi.decodeParameters(['uint256', 'bytes[]'], results);

      if (decodedParams && typeof decodedParams[1] !== 'undefined'){
        const decodedResults = decodedParams[1];

        if (decodedResults && decodedResults.length){
          return decodedResults.map( (decodedResult: string, i:number ) => {
            const output = {
              data:null,
              callData:calls[i],
              extraData:calls[i].extraData
            };
            const returnTypes = calls[i].returnTypes;
            const returnFields = calls[i].returnFields;
            const decodedValues = Object.values(this.web3.eth.abi.decodeParameters(returnTypes, decodedResult));
            if (returnTypes.length === 1){
              output.data = decodedValues[0];
            } else {
              const values = decodedValues.splice(0,returnTypes.length);
              output.data = values ? values.reduce( (acc,v,j) => {
                acc[j] = v;
                acc[returnFields[j]] = v;
                return acc;
              },{}) : {};
            }
            return output;
          });
        }
      }
    } catch (err) {

      const callPromises = calls.map( call => this.catchEm(call.rawCall.call()))
      const decodedCalls = await Promise.all(callPromises);

      return decodedCalls.reduce( (decodedResults, decodedCall, i) => {
        const output = {
          data:null,
          callData:calls[i],
          extraData:calls[i].extraData
        };
        const [, result] = decodedCall

        // if (err){
        //   console.log('Multicall Error:', err, calls[i])
        // }

        if (result){
          output.data = result;
        }

        decodedResults.push(output)
        return decodedResults
      },[])
    }

    return null;
  }
}