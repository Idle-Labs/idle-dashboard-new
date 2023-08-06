import { bnOrZero } from 'helpers/'
import { protocols } from 'constants/protocols'

export const GOOGLE_TAG_ID = 'G-8ZKZ867JNC'

export function sendPageview(path = null) {
  const page_path = path || window.location.hash.substr(1)
  // console.log("Send event: page_view", {
  //   page_title: window.document.title,
  //   page_location: window.location.href,
  //   page_path
  // })
  window.gtag('event', 'page_view', {
    page_title: window.document.title,
    page_location: window.location.href,
    page_path
  })
}

export function sendCustomEvent(event_name, event_params){
  window.gtag('event', event_name, event_params);
}

export function sendViewItemList(item_list_id, item_list_name, items){
  window.gtag("event", "view_item_list", {
    item_list_id,
    item_list_name,
    items
  });
  // console.log("Send event: view_item_list", {
  //   item_list_id,
  //   item_list_name,
  //   items
  // })
}

export function sendSelectItem(item_list_id, item_list_name, asset){
  window.gtag("event", "select_item", {
    item_list_id,
    item_list_name,
    items:[getAssetListItem(asset, item_list_id, item_list_name)]
  });
  // console.log("Send event: select_item", {
  //   item_list_id,
  //   item_list_name,
  //   items:[getAssetListItem(asset, item_list_id, item_list_name)]
  // })
}

export function sendViewItem(asset, value){
  window.gtag("event", "view_item", {
    currency: "USD",
    value: bnOrZero(value).toFixed(2),
    items: [getAssetListItem(asset)]
  });
  // console.log("Send event: view_item", {
  //   currency: "USD",
  //   value: bnOrZero(value).toFixed(2),
  //   items:[getAssetListItem(asset)]
  // })
}

export function sendBeginCheckout(asset, value, extraProps = {}, quantity){
  const itemProps = {...getAssetListItem(asset), ...extraProps}
  quantity = quantity ? bnOrZero(quantity) : bnOrZero(value).div(itemProps.price)

  window.gtag("event", "begin_checkout", {
    currency: "USD",
    value: bnOrZero(value).toFixed(2),
    items: [{...itemProps, quantity: quantity.toFixed(2)}]
  });
  // console.log("Send event: begin_checkout", {
  //   currency: "USD",
  //   value: bnOrZero(value).toFixed(2),
  //   items: [{...itemProps, quantity: quantity.toFixed(2)}]
  // }, extraProps)
}

export function sendPurchase(asset, value, tx){
  const itemProps = getAssetListItem(asset)
  const quantity = bnOrZero(value).div(itemProps.price)

  window.gtag("event", "purchase", {
    currency: "USD",
    transaction_id: tx.hash,
    value: bnOrZero(value).toFixed(2),
    items: [{...itemProps, quantity: quantity.toFixed(2)}]
  });
  // console.log("Send event: purchase", {
  //   currency:"USD",
  //   transaction_id: tx.hash,
  //   value: bnOrZero(value).toFixed(2),
  //   items:[{...itemProps, quantity: quantity.toFixed(2)}]
  // })
}

export function sendChainId(chainId, hostname){
  window.gtag('set', {chainId, hostname});
}

export function sendLogin(method, address){
  const eventParams = {
    method
  }

  if (address) {
    window.gtag('config', GOOGLE_TAG_ID, {
      'user_id': address
    });
    eventParams['address'] = address.replace('0x', '')
  }

  sendCustomEvent('login', eventParams)
}

export function getAssetListItem(asset, item_list_id = '', item_list_name = ''){
  const default_brand = 'Idle'
  const price = bnOrZero(asset.vaultPrice).times(bnOrZero(asset.priceUsd)).toFixed(2)

  const item = {
    price,
    item_id: asset.id,
    item_name: asset.name, // Token name
    item_brand: asset.protocol ? protocols[asset.protocol]?.label || default_brand : default_brand, // Protocol
    item_category: asset.type, // Vault type
    item_category2: asset.status, // Status
    item_category3: asset.variant, // Vault variant
  }

  // Add list info
  if (item_list_id.length){
    item.item_list_id = item_list_id
  }
  if (item_list_name.length){
    item.item_list_name = item_list_name
  }

  return item
}