"use strict";(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[2969,1805],{52969:function(e,t,n){n.r(t),n.d(t,{DepositedAssetsTable:function(){return S}});var i=n(93433),r=n(1413),s=n(29439),a=n(54447),o=n(79681),l=n(95173),c=n(86059),d=n(76728),u=n(66288),f=n(75349),p=n(82172),x=n(56292),h=n(30572),g=n(10956),m=n(1805),v=n(58316),j=n(15542),C=n(1669),w=n(7276),y=n(12056),b=n(55967),A=n(8778),P=n(3498),I=n(89030),T=n(82137),k=n(2092),D=n(43127),M=n(45263),S=function(){var e=(0,l.s0)(),t=(0,C.w)(),n=t.isPortfolioLoaded,S=t.isPortfolioAccountReady,_=t.selectors,Z=_.selectVaultPosition,z=_.selectVaultsWithBalance,F=_.selectVaultsAssetsByType,O=_.selectVaultsAssetsWithBalance,U=(0,o.qM)(),R=(0,w.useState)(1),H=(0,s.Z)(R,2),L=H[0],N=H[1],B=(0,u.X)(),V=B.theme,E=B.isMobile,q=(0,p.Y)(),Y=q.account,W=q.prevAccount,K=(0,w.useState)("Available"),G=(0,s.Z)(K,2),J=G[0],X=G[1],$=(0,h.D)(J);(0,w.useEffect)((function(){if(J!==$)return N(1)}),[J,$,N]);var Q=(0,w.useMemo)((function(){return[{width:"28%",accessor:"id",id:"vaultOperatorOrProtocol",sortType:"alpha",fieldProps:{size:"xs"},stackProps:{justifyContent:"space-between"},extraFields:["strategies"]},{width:"15%",accessor:"name",sortType:"alpha",id:"asset"},{id:"tvl",width:"13%",accessor:"tvlUsd",sortType:"numeric"},{id:"apyWithRewards",width:"13%",accessor:"apy",sortType:"numeric"},{id:"apy7",width:"13%",accessor:"apy7",sortType:"numeric",tables:["Available"]},{id:"apy30",width:"13%",accessor:"apy30",sortType:"numeric",tables:["Available"]},{width:"5%",accessor:"id",id:"chainId",cellSx:{p:"0!important",alignItems:"center"},stackProps:{justifyContent:"center"},tables:["Available"]}]}),[]),ee=(0,w.useMemo)((function(){return Q.reduce((function(e,t){var n=t.id,i=t.accessor,s=t.sortType,a="alpha"===s?A.YC:"numeric"===s?A._O:void 0;return e[n]={id:n,accessor:i,width:t.width,cellSx:t.cellSx,disableSortBy:!a,defaultCanSort:!!a,Header:U(t.title||"defi.".concat(n)),sortType:a?function(e,t){return a(e,t,i)}:void 0,Cell:function(e){var i,s=e.value,a=e.row;return(0,M.jsxs)(P.Kq,(0,r.Z)((0,r.Z)({spacing:2,width:"full",direction:"row",alignItems:"center"},t.stackProps),{},{children:[(0,M.jsx)(m.TableField,{field:n,assetId:a.original.id,value:s,props:t.fieldProps}),null===(i=t.extraFields)||void 0===i?void 0:i.map((function(e){return(0,M.jsx)(m.TableField,{assetId:a.original.id,field:e,value:s},"extraField_".concat(e))}))]}))}},e}),{})}),[Q,U]),te=(0,w.useMemo)((function(){return Q.filter((function(e){return!e.tables||e.tables.includes(J)})).map((function(e){var t=e.id,n=e.accessor,i=e.sortType,s="alpha"===i?A.YC:"numeric"===i?A._O:void 0;return{id:t,accessor:n,width:e.width,cellSx:e.cellSx,disableSortBy:!s,defaultCanSort:!!s,Header:U(e.title||"defi.".concat(t)),sortType:s?function(e,t){return s(e,t,n)}:void 0,Cell:function(n){var i,s=n.value,a=n.row;return(0,M.jsxs)(P.Kq,(0,r.Z)((0,r.Z)({spacing:2,width:"full",direction:"row",alignItems:"center"},e.stackProps),{},{children:[(0,M.jsx)(m.TableField,{field:t,value:s,assetId:a.original.id,props:e.fieldProps}),null===(i=e.extraFields)||void 0===i?void 0:i.map((function(e){return(0,M.jsx)(m.TableField,{field:e,value:s,assetId:a.original.id},"extraField_".concat(e))}))]}))}}}))}),[Q,J,U]),ne=(0,w.useMemo)((function(){return[{Header:"#",accessor:"id",display:"none"}].concat((0,i.Z)(te))}),[te]),ie=(0,w.useMemo)((function(){return[{Header:"#",accessor:"id",display:"none"}].concat((0,i.Z)(te),[{width:"13%",accessor:"balanceUsd",Header:U("defi.balance"),Cell:function(e){var t=e.value;return(0,M.jsx)(I.N2,{noOfLines:2,isLoaded:!!t,children:(0,M.jsx)(c.Amount.Usd,{value:t,textStyle:"tableCell"})})},sortType:A._O},{width:"13%",accessor:"vaultPosition",Header:U("defi.realizedApy"),Cell:function(e){var t=e.value,n=e.row;return(0,M.jsx)(I.N2,{noOfLines:2,isLoaded:!!t,children:t&&(0,M.jsxs)(T.kN,{children:[(0,M.jsx)(T.Jf,{children:(0,M.jsxs)(P.kC,{direction:"row",alignItems:"center",children:[!t.realizedApy.isNaN()&&(0,M.jsx)(T.uY,{type:"increase"}),(0,M.jsx)(m.TableField,{field:"realizedApy",value:t,assetId:n.original.id})]})}),(0,M.jsx)(c.Amount.Usd,{prefix:"+",value:t.usd.earnings,textStyle:"captionSmall"})]})})},sortType:function(e,t){return(0,A._O)(e,t,"vaultPosition.earningsPercentage")}},ee.chainId])}),[U,te,ee]),re=(0,w.useMemo)((function(){return[{Header:"#",accessor:"id",display:"none"}].concat((0,i.Z)(te),[{width:"13%",accessor:"balanceUsd",Header:U("defi.balance"),Cell:function(e){var t=e.value;return(0,M.jsx)(I.N2,{noOfLines:2,isLoaded:!!t,children:(0,M.jsx)(c.Amount.Usd,{value:t,textStyle:"tableCell"})})},sortType:A._O},{width:"13%",accessor:"vaultPosition",Header:U("defi.discountedFees"),Cell:function(e){var t=e.value;return(0,M.jsx)(I.N2,{noOfLines:2,isLoaded:!!t,children:t&&(0,M.jsx)(c.Amount.Usd,{value:t.usd.discountedFees,textStyle:"tableCell"})})},sortType:A._O},ee.chainId])}),[ee,te,U]),se=(0,w.useMemo)((function(){return x.R.reduce((function(e,t){return[].concat((0,i.Z)(e),(0,i.Z)(t.strategies))}),[])}),[]),ae=(0,w.useMemo)((function(){return F?se.reduce((function(e,t){return[].concat((0,i.Z)(e),(0,i.Z)(F(t)))}),[]).filter((function(e){return"deprecated"!==e.status})).sort((function(e,t){return(0,A.gA)(e.tvlUsd).lt((0,A.gA)(t.tvlUsd))?1:-1})).slice(0,15).sort((function(e,t){return(0,A.gA)(e.apy).lt((0,A.gA)(t.apy))?1:-1})).slice(0,10):[]}),[F,se]),oe=(0,w.useMemo)((function(){return z&&n?se.reduce((function(e,t){var n=O(t);return n?[].concat((0,i.Z)(e),(0,i.Z)(n)):e}),[]):[]}),[n,z,O,se]),le=(0,w.useMemo)((function(){return n?oe.filter((function(e){var t,n=Z(e.id);return!(null===(t=e.flags)||void 0===t||!t.feeDiscountEnabled)&&n&&(0,A.d5)(n.usd.discountedFees).gt(0)})):[]}),[oe,n,Z]);(0,w.useEffect)((function(){if(Y&&"Available"===J)return X("Deposited")}),[]),(0,w.useEffect)((function(){if(!W&&Y&&"Available"===J)return X("Deposited")}),[J,Y,W,S,oe]);var ce=(0,w.useCallback)((function(t,n,i){(0,A.fU)(n,i,t.original);y.A[t.original.type].route;return e((0,A.B$)(t.original.type,t.original.id))}),[e]),de=(0,w.useMemo)((function(){return 5}),[]),ue=(0,w.useMemo)((function(){switch(J){case"Deposited":return Math.ceil(oe.length/de);case"Discount":return Math.ceil(le.length/de);default:return Math.ceil(ae.length/de)}}),[J,ae,oe,le,de]),fe=(0,w.useCallback)((function(){return!!L&&(N((function(e){return Math.max(1,e-1)})),!0)}),[N,L]),pe=(0,w.useCallback)((function(){if(L===ue)return!1;N((function(e){return Math.min(ue,e+1)}))}),[N,L,ue]),xe=(0,w.useMemo)((function(){return(0,A.xb)(oe)?(0,M.jsx)(a.Card,{children:(0,M.jsxs)(P.gC,{py:10,spacing:6,width:"full",alignItems:"center",justifyContent:"center",children:[(0,M.jsxs)(P.gC,{spacing:2,width:"full",alignItems:"center",justifyContent:"center",children:[(0,M.jsx)(k.Ee,{src:"images/vaults/emptywallet.png",width:8}),(0,M.jsx)(j.Translation,{textAlign:"center",translation:"defi.empty.deposits.body",color:"cta",isHtml:!0})]}),(0,M.jsx)(j.Translation,{component:D.zx,translation:"defi.empty.deposits.cta",variant:"ctaPrimary",px:10,onClick:function(){return e((0,A.qC)("earn"))}})]})}):E?(0,M.jsx)(P.gC,{mt:20,spacing:6,width:"100%",alignItems:"flex-start",children:(0,M.jsx)(P.gC,{spacing:2,width:"100%",alignItems:"flex-start",children:oe.map((function(e){return e.id&&(0,M.jsx)(f.VaultCard,{assetId:e.id},"vault_".concat(e.id))}))})}):(0,M.jsxs)(P.gC,{spacing:6,width:"full",children:[(0,M.jsx)(a.Card,{children:(0,M.jsx)(v.ReactTable,{columns:ie,data:oe,initialState:{sortBy:[{id:"balanceUsd",desc:!1}]},rowsPerPage:de,page:L,onRowClick:function(e){return ce(e,"dashboard_deposited","Dashboard deposited")}})}),ue>1&&(0,M.jsx)(g.Pagination,{activePage:L,pages:ue,justifyContent:"center",onPrevArrowClick:function(){L&&fe()},onNextArrowClick:function(){L<ue&&pe()},prevArrowColor:1===L?V.colors.ctaDisabled:V.colors.primary,nextArrowColor:L===ue?V.colors.ctaDisabled:V.colors.primary})]})}),[E,ie,oe,L,e,ue,V,de,ce,fe,pe]),he=(0,w.useMemo)((function(){if(!ae.length)return null;return E?(0,M.jsx)(P.gC,{mt:20,spacing:6,width:"100%",alignItems:"flex-start",children:(0,M.jsx)(P.gC,{spacing:2,width:"100%",alignItems:"flex-start",children:ae.map((function(e){return e.id&&(0,M.jsx)(f.VaultCard,{assetId:e.id},"vault_".concat(e.id))}))})}):(0,M.jsxs)(P.gC,{spacing:6,width:"full",children:[(0,M.jsxs)(a.Card,{children:[(0,M.jsx)(P.Ug,{width:"full",alignItems:"flex-start",justifyContent:"space-between"}),(0,M.jsx)(v.ReactTable,{columns:ne,data:ae,initialState:{sortBy:[{id:"apy",desc:!0}]},rowsPerPage:de,page:L,onRowClick:function(e){return ce(e,"dashboard_deposited","Dashboard deposited")}})]}),ue>1&&(0,M.jsx)(g.Pagination,{activePage:L,pages:ue,justifyContent:"center",onPrevArrowClick:function(){L&&fe()},onNextArrowClick:function(){L<ue&&pe()},prevArrowColor:1===L?V.colors.ctaDisabled:V.colors.primary,nextArrowColor:L===ue?V.colors.ctaDisabled:V.colors.primary})]})}),[E,ne,ae,L,ue,V,de,ce,fe,pe]),ge=(0,w.useMemo)((function(){return(0,A.xb)(le)?(0,M.jsx)(a.Card,{children:(0,M.jsxs)(P.gC,{py:10,spacing:6,width:"full",alignItems:"center",justifyContent:"center",children:[(0,M.jsxs)(P.gC,{spacing:2,width:"full",alignItems:"center",justifyContent:"center",children:[(0,M.jsx)(k.Ee,{src:"images/vaults/discount.png",width:8}),(0,M.jsx)(j.Translation,{textAlign:"center",translation:"feeDiscount.table.empty",color:"cta",isHtml:!0})]}),(0,M.jsx)(j.Translation,{component:D.zx,translation:"common.stake",variant:"ctaPrimary",px:10,onClick:function(){return e((0,A.qC)("stake"))}})]})}):E?(0,M.jsx)(P.gC,{mt:20,spacing:6,width:"100%",alignItems:"flex-start",children:(0,M.jsx)(P.gC,{spacing:2,width:"100%",alignItems:"flex-start",children:le.map((function(e){return e.id&&(0,M.jsx)(f.VaultCard,{assetId:e.id},"vault_".concat(e.id))}))})}):(0,M.jsxs)(P.gC,{spacing:6,width:"full",children:[(0,M.jsx)(a.Card,{children:(0,M.jsx)(v.ReactTable,{columns:re,data:le,initialState:{sortBy:[{id:"apy",desc:!1}]},rowsPerPage:de,page:L,onRowClick:function(e){return ce(e,"dashboard_discounted","Dashboard discounted")}})}),ue>1&&(0,M.jsx)(g.Pagination,{activePage:L,pages:ue,justifyContent:"center",onPrevArrowClick:function(){L&&fe()},onNextArrowClick:function(){L<ue&&pe()},prevArrowColor:1===L?V.colors.ctaDisabled:V.colors.primary,nextArrowColor:L===ue?V.colors.ctaDisabled:V.colors.primary})]})}),[E,L,ue,V,re,le,e,de,ce,fe,pe]),me=(0,w.useMemo)((function(){switch(J){case"Deposited":return xe;case"Discount":return ge;default:return he}}),[J,xe,ge,he]);return n?(0,M.jsxs)(P.gC,{spacing:6,width:"full",alignItems:"flex-start",children:[(0,M.jsxs)(P.Ug,{spacing:3,children:[(0,M.jsx)(j.Translation,{component:D.zx,leftIcon:(0,M.jsx)(b.lTP,{size:24}),translation:"common.wallet",variant:"filter","aria-selected":"Deposited"===J,fontSize:"sm",borderRadius:"80px",px:4,onClick:function(){return X("Deposited")}}),(0,M.jsx)(j.Translation,{component:D.zx,leftIcon:(0,M.jsx)(b.pIY,{size:24}),translation:"common.featured",variant:"filter","aria-selected":"Available"===J,fontSize:"sm",borderRadius:"80px",px:4,onClick:function(){return X("Available")}}),(0,M.jsx)(j.Translation,{component:D.zx,leftIcon:(0,M.jsx)(d.njj,{size:24}),translation:"common.discount",variant:"filter","aria-selected":"Discount"===J,fontSize:"sm",borderRadius:"80px",px:4,onClick:function(){return X("Discount")}})]}),me]}):null}},1805:function(e,t,n){n.r(t),n.d(t,{TableField:function(){return o}});var i=n(1413),r=n(89030),s=n(75712),a=n(45263),o=function(e){var t=e.assetId,n=e.field,o=e.value,l=e.section,c=e.props;return(0,a.jsx)(r.N2,{noOfLines:2,isLoaded:!!o,children:(0,a.jsx)(s.AssetProvider,{assetId:t,children:(0,a.jsx)(s.AssetProvider.GeneralData,(0,i.Z)({section:l,field:n},c))})})}}}]);