"use strict";(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[8415,9949,9058,1805],{19949:function(t,e,n){n.r(e),n.d(e,{DiscountedFeesTable:function(){return y}});var a=n(1413),i=n(29439),s=n(45987),o=n(79681),l=n(72877),r=n(54447),c=n(66288),d=n(58316),u=n(1805),p=n(7276),x=n(10956),h=n(97778),m=n(15542),f=n(1669),g=n(3498),v=n(89030),j=n(10658),k=n(8778),w=n(45263),S=["showHeader"],y=function(t){var e=t.showHeader,n=void 0===e||e,y=(0,s.Z)(t,S),C=(0,o.qM)(),I=(0,c.X)().theme,b=(0,p.useState)(1),T=(0,i.Z)(b,2),D=T[0],M=T[1],A=(0,f.w)(),E=A.isPortfolioLoaded,z=A.discountedFees,L=(0,p.useMemo)((function(){return(0,k.xb)(z)?[]:(0,k.Pf)((0,k.mB)(Object.values(z).flat(),"hash"),"timeStamp","desc")}),[z]),P=(0,p.useMemo)((function(){return Math.ceil(L.length/l.qh)}),[L]),F=(0,p.useCallback)((function(){return!!D&&(M((function(t){return Math.max(1,t-1)})),!0)}),[M,D]),U=(0,p.useCallback)((function(){if(D===P)return!1;M((function(t){return Math.min(P,t+1)}))}),[M,D,P]),Z=(0,p.useMemo)((function(){return{sortBy:[{id:"tier",desc:!0}]}}),[]),W=(0,p.useMemo)((function(){return[{id:"id",Header:"#",accessor:"hash",display:"none"},{id:"asset",accessor:"assetId",Header:C("defi.asset"),Cell:function(t){var e=t.value;return(0,w.jsxs)(g.Ug,{spacing:2,width:"full",alignItems:"center",justifyContent:"space-between",children:[(0,w.jsx)(u.TableField,{field:"asset",value:E,assetId:e}),(0,w.jsx)(u.TableField,{field:"productTagWithRisk",value:E,assetId:e})]})}},{accessor:"value",Header:C("transactionRow.amount"),Cell:function(t){var e=t.value,n=t.row;return(0,w.jsx)(v.N2,{noOfLines:2,isLoaded:!!e,children:(0,w.jsx)(h.TokenAmount,{assetId:n.original.assetId,amount:e,showIcon:!1,textStyle:"tableCell"})})},sortType:k._O},{accessor:"timeStamp",Header:C("transactionRow.date"),Cell:function(t){var e=t.value;return(0,w.jsx)(g.xv,{textStyle:"tableCell",children:(0,k.p6)(e,"YYYY/MM/DD HH:mm",!0)})},sortType:k._O},{id:"hash",accessor:"hash",Header:C("transactionRow.hash"),Cell:function(t){var e=t.value,n=t.row;return(0,w.jsx)(g.Ug,{width:"full",justifyContent:"flex-start",children:(0,w.jsx)(j.TransactionLink,{hash:e,chainId:n.original.chainId})})},sortType:k._O}]}),[C,E]);return L.length?(0,w.jsxs)(r.Card,(0,a.Z)((0,a.Z)({p:0},y),{},{children:[n&&(0,w.jsx)(m.Translation,{translation:"defi.discountedFees",fontSize:"lg",component:r.Card.Heading}),(0,k.xb)(L)?(0,w.jsx)(g.gC,{py:6,width:"full",alignItems:"center",justifyContent:"center",children:(0,w.jsx)(m.Translation,{textAlign:"center",translation:"feeDiscount.table.stakingEmpty",color:"cta",isHtml:!0})}):(0,w.jsx)(d.ReactTable,{columns:W,data:L,page:D,rowsPerPage:l.qh,initialState:Z,onRowClick:function(t){return(0,k.xw)((0,k.QG)(t.original.chainId,t.original.hash))}}),P>1&&(0,w.jsx)(x.Pagination,{activePage:D,pages:P,justifyContent:"center",onPrevArrowClick:function(){D&&F()},onNextArrowClick:function(){D<P&&U()},prevArrowColor:1===D?I.colors.ctaDisabled:I.colors.primary,nextArrowColor:D===P?I.colors.ctaDisabled:I.colors.primary})]})):null}},59058:function(t,e,n){n.r(e),n.d(e,{Unstake:function(){return w}});var a=n(74165),i=n(15861),s=n(33482),o=n(55967),l=n(82172),r=n(7276),c=n(43127),d=n(3498),u=n(15542),p=n(1669),x=n(23023),h=n(78951),m=n(53465),f=n(67360),g=n(86393),v=n(75712),j=n(8778),k=n(45263),w=function(t){var e,n,w,S=t.itemIndex,y=t.chainIds,C=void 0===y?[]:y,I=(0,v.useAssetProvider)(),b=I.asset,T=I.vault,D=(0,l.Y)(),M=D.account,A=D.checkChainEnabled,E=(0,m.useOperativeComponent)(),z=E.dispatch,L=E.activeItem,P=E.setActionIndex,F=(0,p.w)(),U=F.stakingData,Z=F.selectors.selectVaultPrice,W=(0,x.R)(),H=W.sendTransaction,B=W.setGasLimit,_=W.state.block,O=(0,r.useMemo)((function(){return A(C)}),[C,A]),Y=(0,r.useMemo)((function(){var t;return(0,j.d5)(null===U||void 0===U||null===(t=U.position)||void 0===t?void 0:t.deposited)}),[U]),G=(0,r.useMemo)((function(){var t,e;return!(null===U||void 0===U||null===(t=U.position)||void 0===t||!t.lockEnd||!_)&&(0,j.qF)(null===U||void 0===U||null===(e=U.position)||void 0===e?void 0:e.lockEnd).isSameOrBefore((0,j.qF)(1e3*_.timestamp))}),[U,_]),R=(0,r.useMemo)((function(){var t,e;return null!==U&&void 0!==U&&null!==(t=U.position)&&void 0!==t&&t.lockEnd?(0,j.p6)(null===U||void 0===U||null===(e=U.position)||void 0===e?void 0:e.lockEnd,"YYYY-MM-DD HH:mm",!0):null}),[U]),q=(0,r.useCallback)((function(){M&&G&&T&&"getWithdrawContractSendMethod"in T&&"getWithdrawParams"in T&&T instanceof s.y&&(0,i.Z)((0,a.Z)().mark((function t(){var e,n;return(0,a.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=T.getWithdrawParams(),n=T.getWithdrawContractSendMethod(e),H(T.id,T.id,n);case 3:case"end":return t.stop()}}),t)})))()}),[M,G,T,H]),N=(0,r.useCallback)((0,i.Z)((0,a.Z)().mark((function t(){var e,n,i,o,l;return(0,a.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(T&&"getWithdrawContractSendMethod"in T&&"getWithdrawParams"in T&&T instanceof s.y){t.next=2;break}return t.abrupt("return");case 2:if(e=T.getMethodDefaultGasLimit("unstake"),M&&G){t.next=5;break}return t.abrupt("return",e);case 5:return n={from:null===M||void 0===M?void 0:M.address},i=T.getWithdrawParams(),o=T.getWithdrawContractSendMethod(i),t.next=10,(0,j.$K)(o,n);case 10:if(t.t0=t.sent,t.t0){t.next=13;break}t.t0=e;case 13:return l=t.t0,t.abrupt("return",l);case 15:case"end":return t.stop()}}),t)}))),[M,T,G]);(0,r.useEffect)((function(){L===S&&(0,i.Z)((0,a.Z)().mark((function t(){var e;return(0,a.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,N();case 2:e=t.sent,B(e);case 4:case"end":return t.stop()}}),t)})))()}),[L,S,N,B]),(0,r.useEffect)((function(){L===S&&(z({type:"SET_ASSET",payload:b}),Z&&T&&(z({type:"SET_AMOUNT",payload:(0,j.gA)(Y).toString()}),z({type:"SET_DEFAULT_AMOUNT",payload:(0,j.gA)(Y).toString()})))}),[T,b,Y,Z,L,S,z,q]);var K=(0,r.useMemo)((function(){return!O&&b?(0,k.jsx)(f.SwitchNetworkButton,{chainId:b.chainId,width:"full"}):M?(0,k.jsx)(u.Translation,{component:c.zx,translation:"common.withdraw",disabled:!G,onClick:q,variant:"ctaFull"}):(0,k.jsx)(g.ConnectWalletButton,{variant:"ctaFull"})}),[M,G,q,O,b]);return(0,k.jsx)(v.AssetProvider,{flex:1,width:"100%",assetId:null===b||void 0===b?void 0:b.id,children:(0,k.jsxs)(d.gC,{flex:1,spacing:6,width:"100%",height:"100%",id:"withdraw-container",alignItems:"space-between",justifyContent:"flex-start",pt:O&&null!==U&&void 0!==U&&null!==(e=U.position)&&void 0!==e&&e.lockEnd?8:0,children:[(0,k.jsx)(d.gC,{flex:1,spacing:0,id:"confirm-on-wallet",alignItems:"flex-start",children:null!==U&&void 0!==U&&null!==(n=U.position)&&void 0!==n&&n.lockEnd?G?(0,k.jsx)(d.M5,{py:14,flex:1,px:[4,10],width:"100%",children:(0,k.jsxs)(d.gC,{spacing:6,children:[(0,k.jsx)(o.ppH,{size:72}),(0,k.jsxs)(d.gC,{spacing:4,children:[(0,k.jsx)(u.Translation,{component:d.xv,translation:"staking.lockExpired",textStyle:"heading",fontSize:"h3",textAlign:"center"}),(0,k.jsx)(u.Translation,{component:d.xv,translation:"staking.canWithdrawLock",params:{amount:(0,j.dm)(Y),asset:null===b||void 0===b?void 0:b.name},textStyle:"captionSmall",textAlign:"center"})]})]})}):(0,k.jsxs)(d.gC,{py:20,flex:1,spacing:6,px:[6,10],width:"100%",children:[(0,k.jsx)(o.FKe,{size:72}),(0,k.jsxs)(d.gC,{spacing:4,children:[(0,k.jsx)(u.Translation,{component:d.xv,translation:"staking.lockNotExpired",textStyle:"heading",fontSize:"h3",textAlign:"center"}),(0,k.jsx)(u.Translation,{component:d.xv,translation:"staking.waitUntilLockExpired",params:{lockEndDate:R},textStyle:"captionSmall",textAlign:"center"}),(0,k.jsx)(u.Translation,{component:c.zx,translation:"staking.increaseLock",onClick:function(){return P(0)},variant:"ctaPrimary",px:10})]})]}):(0,k.jsx)(d.M5,{px:6,flex:1,width:"100%",children:(0,k.jsxs)(d.gC,{spacing:5,children:[(0,k.jsx)(u.Translation,{component:d.xv,translation:"staking.noStake",textStyle:"heading",fontSize:"h3",textAlign:"center"}),(0,k.jsx)(u.Translation,{component:d.xv,translation:"staking.stakeBeforeUnstake",textStyle:"captionSmall",textAlign:"center"}),(0,k.jsx)(u.Translation,{component:c.zx,translation:"common.stake",onClick:function(){return P(0)},variant:"ctaPrimary",px:10})]})})}),(null===U||void 0===U||null===(w=U.position)||void 0===w?void 0:w.lockEnd)&&G&&(0,k.jsxs)(d.gC,{spacing:4,id:"footer",alignItems:"flex-start",children:[G&&(0,k.jsx)(h.EstimatedGasFees,{}),K]})]})})}},48415:function(t,e,n){n.r(e),n.d(e,{Staking:function(){return A}});var a=n(1413),i=n(8778),s=n(7276),o=n(54447),l=n(72877),r=n(86059),c=n(24974),d=n(55967),u=n(66288),p=n(67041),x=n(82172),h=n(61617),m=n(59058),f=n(96362),g=n(97778),v=n(15542),j=n(87099),k=n(1669),w=n(75712),S=n(61838),y=n(72258),C=n(19949),I=n(37658),b=n(3148),T=n(3498),D=n(2092),M=n(45263),A=function(){var t=(0,x.Y)().account,e=(0,u.X)().isMobile,n=(0,k.w)(),A=n.isVaultsPositionsLoaded,E=n.stakingData,z=n.selectors,L=z.selectVaultsByType,P=z.selectAssetById,F=z.selectVaultTransactions,U=(0,s.useMemo)((function(){if(P){var t=(0,c.Zs)(l.zS,j.MI);return t&&P(t.address)}}),[P]),Z=(0,s.useMemo)((function(){var t;return L&&(null===(t=L("STK"))||void 0===t?void 0:t[0])}),[L]),W=(0,s.useMemo)((function(){return P&&Z&&P(Z.id)}),[P,Z]),H=(0,s.useMemo)((function(){return A&&Z&&F(Z.id)}),[A,Z,F]),B=(0,s.useMemo)((function(){return(H&&H.reduce((function(t,e){switch(e.action){case"stake":t.totalDeposited=t.totalDeposited.plus(e.underlyingAmount);break;case"unstake":t.totalDeposited=t.totalDeposited.minus(e.underlyingAmount)}return t.totalDeposited.lte(0)?t.startTimestamp=null:t.startTimestamp||(t.startTimestamp=e.timeStamp),t}),{startTimestamp:null,totalDeposited:(0,i.gA)(0)})).startTimestamp}),[H]),_=(0,s.useMemo)((function(){if(!B||!E)return null;var t=Math.round(Date.now()/1e3)-B;return(0,i.gA)(E.position.claimable).div(E.position.deposited).times(j.eG).div(t).times(100)}),[B,E]),O=[{type:"stake",component:p.Stake,label:"common.stake",chainIds:[l.zS],steps:[{type:"approve",component:f.Approve,props:{amountUsd:null},label:"modals.approve.header"}]},{type:"unstake",component:m.Unstake,label:"common.unstake",chainIds:[l.zS],steps:[]}],Y=(0,s.useMemo)((function(){if(!t||!E||E.position.deposited.lte(0))return null;return(0,M.jsxs)(T.gC,{spacing:6,width:"full",alignItems:"flex-start",children:[(0,M.jsx)(v.Translation,{translation:"staking.yourstkIDLE",component:T.xv,textStyle:"heading",fontSize:"h3"}),(0,M.jsx)(T.MI,{columns:[2,4],spacing:[6,20],children:[{field:"stakingDeposited",props:{fontSize:"h3",textStyle:"heading"},label:"assets.assetDetails.generalData.totalIDLEStaked",tooltip:"assets.assetDetails.tooltips.totalIDLEStaked"},{field:"stkIDLEBalance",props:{fontSize:"h3",textStyle:"heading"},label:"common.balance",tooltip:"assets.assetDetails.tooltips.stkIDLEBalance"},{field:"stakingEndDate",props:{fontSize:"h3",textStyle:"heading"},tooltip:"assets.assetDetails.tooltips.lockEndDate",label:"assets.assetDetails.generalData.lockedUntil"},{field:"stakingShare",props:{fontSize:"h3",textStyle:"heading"},tooltip:"assets.assetDetails.tooltips.stakingShare",label:"defi.share"}].map((function(t){return(0,M.jsx)(b.AssetGeneralDataField,{generalData:t},"field_".concat(t.field))}))})]})}),[t,E]),G=(0,s.useMemo)((function(){var n,a;if(!t||!E||E.position.claimable.lte(0)||!Z)return null;var i=Z.getClaimRewardsContractSendMethod();return e?(0,M.jsx)(w.AssetProvider,{wrapFlex:!1,assetId:null===U||void 0===U?void 0:U.id,children:(0,M.jsx)(o.Card,{p:6,children:(0,M.jsxs)(T.gC,{spacing:4,width:"100%",alignItems:"flex-start",children:[(0,M.jsx)(T.Ug,{width:"full",justifyContent:"space-between",children:(0,M.jsx)(h.AssetLabel,{assetId:null===U||void 0===U?void 0:U.id})}),(0,M.jsxs)(T.Ug,{width:"full",justifyContent:"space-between",children:[(0,M.jsxs)(T.gC,{spacing:1,alignItems:"flex-start",children:[(0,M.jsx)(v.Translation,{component:T.xv,translation:"defi.realizedApy",textStyle:"captionSmall"}),(0,M.jsx)(T.Ug,{spacing:1,justifyContent:"flex-start",children:(0,M.jsx)(r.Amount.Percentage,{value:_,textStyle:"heading",fontSize:"h3"})})]}),(0,M.jsxs)(T.gC,{spacing:1,alignItems:"flex-end",children:[(0,M.jsx)(v.Translation,{component:T.xv,translation:"defi.claimable",textStyle:"captionSmall"}),(0,M.jsx)(g.TokenAmount,{assetId:null===E||void 0===E||null===(n=E.IDLE.asset)||void 0===n?void 0:n.id,showIcon:!1,amount:E.position.claimable,decimals:2,textStyle:"heading",fontSize:"h3"})]})]}),(0,M.jsx)(y.TransactionButton,{text:"defi.claim",vaultId:Z.id,assetId:Z.id,contractSendMethod:i,actionType:"claim",amount:E.position.claimable.toString(),width:"100%",chainIds:[l.zS],disabled:E.position.claimable.lte(0)})]})})}):(0,M.jsx)(o.Card,{p:6,px:8,width:"100%",children:(0,M.jsxs)(T.Kq,{width:"100%",spacing:[0,6],direction:["column","row"],flexWrap:["wrap","nowrap"],justifyContent:["flex-start","space-between"],children:[(0,M.jsx)(h.AssetLabel,{assetId:null===U||void 0===U?void 0:U.id}),(0,M.jsxs)(T.gC,{pb:[2,0],spacing:[1,2],width:["50%","auto"],alignItems:"flex-start",justifyContent:"flex-start",children:[(0,M.jsx)(v.Translation,{component:T.xv,translation:"defi.realizedApy",textStyle:"captionSmall"}),(0,M.jsx)(r.Amount.Percentage,{value:_,fontSize:"h3",textStyle:"heading"})]}),(0,M.jsxs)(T.gC,{pb:[2,0],spacing:[1,2],width:["50%","auto"],alignItems:"flex-start",justifyContent:"flex-start",children:[(0,M.jsx)(v.Translation,{component:T.xv,translation:"defi.claimable",textStyle:"captionSmall"}),(0,M.jsx)(g.TokenAmount,{assetId:null===E||void 0===E||null===(a=E.IDLE.asset)||void 0===a?void 0:a.id,showIcon:!1,amount:E.position.claimable,decimals:2,textStyle:"heading",fontSize:"h3"})]}),(0,M.jsx)(y.TransactionButton,{text:"defi.claim",vaultId:Z.id,assetId:Z.id,contractSendMethod:i,actionType:"claim",amount:E.position.claimable.toString(),width:["100%","150px"],chainIds:[l.zS],disabled:E.position.claimable.lte(0)})]})})}),[t,e,E,U,_,Z]),R=(0,s.useMemo)((function(){var t=[{image:"images/staking/get-idle.png",translation:"strategies.staking.howItWorks.steps.cta1",props:{justifyContent:"flex-end"}},{image:"images/staking/stake.png",translation:"strategies.staking.howItWorks.steps.cta2",props:{justifyContent:"center"}},{image:"images/staking/fee-discount.png",translation:"strategies.staking.howItWorks.steps.cta3",props:{justifyContent:"flex-start"}}];return(0,M.jsxs)(T.gC,{spacing:4,width:"full",alignItems:"flex-start",children:[(0,M.jsx)(v.Translation,{translation:"strategies.staking.howItWorks.title",textStyle:"ctaStatic"}),(0,M.jsx)(o.Card.Flex,{py:6,px:10,width:"full",alignItems:"center",justifyContent:"center",children:(0,M.jsx)(T.MI,{columns:3,spacing:6,width:"fit-content",children:t.map((function(e,n){return(0,s.createElement)(T.Ug,(0,a.Z)((0,a.Z)({spacing:4},e.props),{},{key:"step_".concat(n)}),(0,M.jsx)(D.Ee,{src:e.image,width:14}),e.link?(0,M.jsx)(v.Translation,{component:T.rU,translation:e.translation,textDecoration:"underline",isExternal:!0,href:e.link}):(0,M.jsx)(v.Translation,{translation:e.translation}),n<t.length-1&&(0,M.jsx)(T.Ug,{pl:2,children:(0,M.jsx)(d.KEG,{size:16})}))}))})})]})}),[]);return(0,M.jsxs)(T.xu,{width:"100%",children:[(0,M.jsx)(T.gC,{spacing:6,my:[10,14],width:"100%",direction:["column","row"],justifyContent:"flex-start",alignItems:["center","flex-start"],children:(0,M.jsx)(v.Translation,{translation:"navBar.stakeIDLE",component:T.X6,as:"h2",size:"3xl"})}),(0,M.jsxs)(T.Ug,{width:"100%",spacing:[0,10],alignItems:"space-between",children:[(0,M.jsx)(T.Kq,{flex:1,mb:[20,0],spacing:10,width:["100%",.7],children:(0,M.jsxs)(T.gC,{spacing:10,width:"100%",alignItems:"flex-start",children:[(0,M.jsx)(v.Translation,{translation:"strategies.staking.description",isHtml:!0}),(0,M.jsxs)(T.gC,{spacing:4,width:"full",alignItems:"flex-start",children:[R,(0,M.jsx)(b.AssetGeneralData,{assetId:null===W||void 0===W?void 0:W.id})]}),Y,G,(0,M.jsx)(C.DiscountedFeesTable,{p:10}),(0,M.jsx)(S.FeeDiscountTable,{p:10})]})}),(0,M.jsx)(I.InteractiveComponent,{vaultId:null===W||void 0===W?void 0:W.id,assetId:null===Z||void 0===Z?void 0:Z.id,actions:O})]})]})}},1805:function(t,e,n){n.r(e),n.d(e,{TableField:function(){return l}});var a=n(1413),i=n(89030),s=n(75712),o=n(45263),l=function(t){var e=t.assetId,n=t.field,l=t.value,r=t.section,c=t.props;return(0,o.jsx)(i.N2,{noOfLines:2,isLoaded:!!l,children:(0,o.jsx)(s.AssetProvider,{assetId:e,children:(0,o.jsx)(s.AssetProvider.GeneralData,(0,a.Z)({section:r,field:n},c))})})}}}]);