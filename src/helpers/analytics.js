import { bnOrZero } from 'helpers/'
import { protocols } from 'constants/protocols'

export function sendPageview(path = null) {
  const page_path = path || window.location.hash.substr(1)
  if (window.gtag) {
    // console.log('sendGoogleAnalyticsPageview', {
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
}

export function sendViewItemList(item_list_id, item_list_name, items){
  window.gtag("event", "view_item_list", {
    item_list_id,
    item_list_name,
    items
  });
  /*
  console.log("view_item_list", {
    item_list_id,
    item_list_name,
    items
  })
  */
}

export function sendSelectItem(item_list_id, item_list_name, asset){
  window.gtag("event", "select_item", {
    item_list_id,
    item_list_name,
    items:[getAssetListItem(asset, item_list_id, item_list_name)]
  });
  /*
  console.log("select_item", {
    item_list_id,
    item_list_name,
    items:[getAssetListItem(asset, item_list_id, item_list_name)]
  })
  */
}

export function sendViewItem(asset){
  // window.gtag("event", "view_item", {
  //   currency:"USD",
  //   value:asset.vaultPrice.toFixed()
  //   items:[getAssetListItem(asset)]
  // });
  console.log("view_item", {
    currency:"USD",
    value:bnOrZero(asset.vaultPrice).times(bnOrZero(asset.priceUsd)).toFixed(2),
    items:[getAssetListItem(asset)]
  })
}

export function getAssetListItem(asset, item_list_id = '', item_list_name = ''){
  return {
    item_id: asset.id,
    item_name: asset.name, // Token name
    item_brand: asset.protocol ? protocols[asset.protocol]?.label : '', // Protocol
    item_category: asset.type, // Vault type
    item_category2: asset.status, // Status
    item_category3: asset.variant, // Vault variant
    item_list_name,
    item_list_id
  }
}