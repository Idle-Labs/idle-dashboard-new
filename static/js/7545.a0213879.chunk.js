"use strict";(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[7545,494,8129,6957,5349],{60494:function(e,t,n){n.r(t),n.d(t,{SearchBar:function(){return u}});var s=n(29439),a=n(55967),i=n(79681),r=n(7276),l=n(66288),o=n(3498),c=n(3497),d=n(45263),u=function(e){var t=e.placeholder,n=e.handleSearchChange,u=(0,l.X)().theme,x=(0,i.qM)(),p=(0,r.useState)(""),f=(0,s.Z)(p,2),g=f[0],m=f[1];return(0,r.useEffect)((function(){n(g)}),[g,n]),(0,d.jsx)(o.Ug,{children:(0,d.jsxs)(c.BZ,{children:[(0,d.jsx)(c.II,{type:"text",placeholder:x(t),variant:"search",onChange:function(e){return m(e.target.value)}}),(0,d.jsx)(c.xH,{children:(0,d.jsx)(a.vU7,{size:24,color:u.colors.cta})})]})})}},87545:function(e,t,n){n.r(t),n.d(t,{Strategy:function(){return M},TableField:function(){return k}});var s=n(93433),a=n(1413),i=n(29439),r=n(54447),l=n(79681),o=n(95173),c=n(86059),d=n(55967),u=n(39807),x=n(66288),p=n(75349),f=n(60494),g=n(82172),m=n(58316),h=n(15542),j=n(85267),v=n(1669),y=n(12056),A=n(75712),b=n(7276),C=n(88129),S=n(67360),w=n(21031),I=n(89030),P=n(3498),T=n(82137),Z=n(2092),z=n(45263),k=function(e){var t=e.field,n=e.row,s=e.value,a=n.original.id;return(0,z.jsx)(I.N2,{noOfLines:2,isLoaded:!!s,children:(0,z.jsx)(A.AssetProvider,{assetId:a,children:(0,z.jsx)(A.AssetProvider.GeneralData,{section:"strategy",field:t})})})},M=function(){var e=(0,o.s0)(),t=(0,l.qM)(),n=(0,x.X)().isMobile,A=(0,u.f)().openModal,M=(0,j.m)(),U=M.location,_=M.params,B=(0,g.Y)(),N=B.account,O=B.network,F=(0,b.useState)(null),L=(0,i.Z)(F,2),E=L[0],D=L[1],H=(0,b.useState)(null),R=(0,i.Z)(H,2),G=R[0],V=R[1],W=(0,b.useState)(null),q=(0,i.Z)(W,2),Y=q[0],$=q[1],K=(0,b.useState)(null),J=(0,i.Z)(K,2),X=J[0],Q=J[1],ee=(0,v.w)(),te=ee.isPortfolioLoaded,ne=ee.selectors,se=ne.selectVaultsWithBalance,ae=ne.selectVaultsAssetsByType,ie=ne.selectVaultsAssetsWithBalance,re=(0,b.useMemo)((function(){return Object.keys(y.A).find((function(e){return y.A[e].route===_.strategy}))}),[_]),le=(0,b.useCallback)((function(t,n,s){return(0,w.fU)(n,s,t.original),e("".concat(null===U||void 0===U?void 0:U.pathname.replace(/\/$/,""),"/").concat(t.original.id))}),[e,U]),oe=(0,b.useMemo)((function(){return re&&y.A[re].columns}),[re]),ce=(0,b.useMemo)((function(){return re&&oe?oe.map((function(e){var n=e.id,s=e.accessor,i=e.sortType,r="alpha"===i?w.YC:"numeric"===i?w._O:void 0;return{id:n,accessor:s,disableSortBy:!r,defaultCanSort:!!r,Header:t(e.title||"defi.".concat(n)),sortType:r?function(e,t){return r(e,t,s)}:void 0,Cell:function(t){var s=t.value,i=t.row;return e.extraFields&&e.extraFields.length>0?(0,z.jsxs)(P.Kq,(0,a.Z)((0,a.Z)({spacing:2,width:"full",direction:"row",alignItems:"center"},e.stackProps),{},{children:[(0,z.jsx)(k,{field:n,value:s,row:i}),e.extraFields.map((function(e){return(0,z.jsx)(k,{field:e,value:s,row:i},"extraField_".concat(e))}))]})):(0,z.jsx)(k,{field:n,value:s,row:i})}}})):[]}),[re,oe,t]),de=(0,b.useMemo)((function(){return re&&oe?oe.filter((function(e){return!e.tables||e.tables.includes("Deposited")})).map((function(e){var n=e.id,s=e.accessor,i=e.sortType,r="alpha"===i?w.YC:"numeric"===i?w._O:void 0;return{id:n,accessor:s,disableSortBy:!r,defaultCanSort:!!r,Header:t(e.title||"defi.".concat(n)),sortType:r?function(e,t){return r(e,t,s)}:void 0,Cell:function(t){var s=t.value,i=t.row;return e.extraFields&&e.extraFields.length>0?(0,z.jsxs)(P.Kq,(0,a.Z)((0,a.Z)({spacing:2,width:"full",direction:"row",alignItems:"center"},e.stackProps),{},{children:[(0,z.jsx)(k,{field:n,value:s,row:i}),e.extraFields.map((function(e){return(0,z.jsx)(k,{field:e,value:s,row:i},"extraField_".concat(e))}))]})):(0,z.jsx)(k,{field:n,value:s,row:i})}}})):[]}),[re,oe,t]),ue=(0,b.useMemo)((function(){return[{Header:"#",accessor:"id",display:"none"}].concat((0,s.Z)(de),[{accessor:"balanceUsd",Header:t("defi.balance"),Cell:function(e){var t=e.value;return(0,z.jsx)(I.N2,{noOfLines:2,isLoaded:!!t,children:(0,z.jsx)(c.Amount.Usd,{value:t,textStyle:"tableCell"})})},sortType:w._O},{accessor:"vaultPosition",Header:t("defi.realizedApy"),Cell:function(e){var t=e.value;return(0,z.jsx)(I.N2,{noOfLines:2,isLoaded:!!t,children:t&&(0,z.jsxs)(T.kN,{children:[(0,z.jsx)(T.Jf,{children:(0,z.jsxs)(P.kC,{direction:"row",alignItems:"center",children:[!t.realizedApy.isNaN()&&(0,z.jsx)(T.uY,{type:"increase"}),(0,z.jsx)(c.Amount.Percentage,{value:t.realizedApy,textStyle:"tableCell"})]})}),(0,z.jsx)(c.Amount.Usd,{prefix:"+",value:t.usd.earnings,textStyle:"captionSmall"})]})})},sortType:function(e,t){return(0,w._O)(e,t,"vaultPosition.earningsPercentage")}}])}),[t,de]),xe=(0,b.useMemo)((function(){return[{Header:"#",accessor:"id",display:"none"}].concat((0,s.Z)(ce))}),[ce]),pe=(0,b.useMemo)((function(){return se&&te?ie(re):[]}),[te,se,ie,re]),fe=(0,b.useMemo)((function(){return ae&&te?ae(re):[]}),[te,ae,re]),ge=(0,b.useMemo)((function(){return ae&&te?ae(re).filter((function(e){return!pe.map((function(e){return e.id})).includes(e.id)})):[]}),[te,ae,pe,re]),me=(0,b.useMemo)((function(){return re?"".concat(re,"_deposited"):""}),[re]),he=(0,b.useMemo)((function(){if(!re)return"";var e=t(y.A[re].label);return"".concat(e," - ").concat(t("defi.deposited"))}),[re,t]),je=(0,b.useMemo)((function(){return re?"".concat(re,"_available"):""}),[re]),ve=(0,b.useMemo)((function(){if(!re)return"";var e=t(y.A[re].label);return"".concat(e," - ").concat(t("common.available"))}),[re,t]);(0,b.useEffect)((function(){if(re&&X!==re&&pe.length){var e=pe.map((function(e){return(0,w.ym)(e,me,he)}));(0,w.y6)(me,he,e),Q(re)}}),[N,re,t,me,he,pe,X,Q]),(0,b.useEffect)((function(){if(re&&Y!==re&&ge.length){var e=ge.map((function(e){return(0,w.ym)(e,je,ve)}));(0,w.y6)(je,ve,e),$(re)}}),[N,t,je,ve,Y,$,re,ge]);var ye=(0,b.useMemo)((function(){if(!pe.length)return null;var e=pe.filter((function(e){return!G||!G.length||null!==new RegExp(G,"i").exec(e.name)}));return n?(0,z.jsxs)(P.gC,{mt:20,spacing:6,width:"100%",alignItems:"flex-start",children:[(0,z.jsx)(h.Translation,{translation:"defi.depositedAssets",component:P.X6,as:"h3",fontSize:"lg"}),(0,z.jsx)(P.gC,{spacing:2,width:"100%",alignItems:"flex-start",children:e.map((function(e){return e.id&&(0,z.jsx)(p.VaultCard,{assetId:e.id},"vault_".concat(e.id))}))})]}):(0,z.jsxs)(r.Card,{mt:10,children:[(0,z.jsxs)(P.Ug,{width:"full",alignItems:"flex-start",justifyContent:"space-between",children:[(0,z.jsx)(h.Translation,{translation:"defi.depositedAssets",component:r.Card.Heading,fontSize:"lg"}),(0,z.jsx)(f.SearchBar,{placeholder:"defi.searchToken",handleSearchChange:V})]}),(0,z.jsx)(m.ReactTable,{columns:ue,data:e,initialState:{sortBy:[{id:"balanceUsd",desc:!1}]},onRowClick:function(e){return le(e,me,he)}})]})}),[n,ue,G,V,me,he,pe,le]),Ae=(0,b.useMemo)((function(){if(te&&!ge.length)return null;var e=ge.filter((function(e){return!E||!E.length||null!==new RegExp(E,"i").exec(e.name)}));return n?(0,z.jsxs)(P.gC,{mt:20,spacing:6,width:"full",alignItems:"flex-start",children:[(0,z.jsx)(h.Translation,{translation:"defi.availableAssets",component:P.X6,as:"h3",fontSize:"lg"}),(0,z.jsx)(P.gC,{spacing:2,width:"100%",alignItems:"flex-start",children:e.map((function(e){return e.id&&(0,z.jsx)(p.VaultCard,{assetId:e.id},"vault_".concat(e.id))}))})]}):(0,z.jsxs)(r.Card,{mt:10,children:[(0,z.jsxs)(P.Ug,{width:"full",alignItems:"flex-start",justifyContent:"space-between",children:[(0,z.jsx)(h.Translation,{translation:"defi.availableAssets",component:r.Card.Heading,fontSize:"lg"}),(0,z.jsx)(f.SearchBar,{placeholder:"defi.searchToken",handleSearchChange:D})]}),te?(0,z.jsx)(m.ReactTable,{columns:xe,data:e,initialState:{sortBy:[{id:"tvl",desc:!1}]},onRowClick:function(e){return le(e,je,ve)}}):(0,z.jsxs)(P.Kq,{children:[(0,z.jsx)(I.Od,{}),(0,z.jsx)(I.Od,{})]})]})}),[n,te,E,D,xe,je,ve,ge,le]),be=(0,b.useMemo)((function(){var e,t,n,s;if(!re||!y.A[re].banner)return null;var a=null===(e=y.A[re].banner)||void 0===e?void 0:e.modal;return(0,z.jsx)(r.Card.Dark,{p:[4,5],border:0,position:"relative",children:(0,z.jsxs)(P.Kq,{width:"full",spacing:[2,3],alignItems:"center",justifyContent:"center",direction:["column","row"],children:[(0,z.jsx)(h.Translation,{component:P.xu,width:"auto",textAlign:"center",translation:"common.new",layerStyle:"gradientBadge"}),(0,z.jsx)(h.Translation,{textAlign:"center",translation:null===(t=y.A[re].banner)||void 0===t?void 0:t.text,isHtml:!0,textStyle:"caption"}),"BY"===re&&(0,z.jsxs)(P.Ug,{spacing:2,children:[(0,z.jsx)(Z.Ee,{src:"images/strategies/AA.svg",width:6}),(0,z.jsx)(Z.Ee,{src:"images/strategies/BB.svg",width:6})]}),(null===(n=y.A[re].banner)||void 0===n?void 0:n.cta)&&(0,z.jsxs)(P.Ug,{spacing:2,right:[0,6],alignItems:"center",justifyContent:"center",position:["relative","absolute"],children:[(0,z.jsx)(h.Translation,{translation:null===(s=y.A[re].banner)||void 0===s?void 0:s.cta,textAlign:"center",textStyle:"cta",onClick:function(){return A(a)}}),(0,z.jsx)(d.KEG,{})]})]})})}),[re,A]),Ce=(0,b.useMemo)((function(){return re?(0,z.jsxs)(P.gC,{width:"full",spacing:10,children:[be,(0,z.jsxs)(P.Kq,{spacing:[8,0],direction:["column","row"],alignItems:["center","flex-start"],width:["100%","100%","100%","100%","70%"],children:[(0,z.jsxs)(P.gC,{pr:[0,14],pt:[0,20],spacing:10,direction:"column",width:["100%","65%"],alignItems:["center","flex-start"],children:[(0,z.jsx)(h.Translation,{isHtml:!0,translation:y.A[re].title||y.A[re].label,component:P.X6,fontFamily:"body",as:"h2",size:"3xl",fontWeight:"bold"}),!n&&(0,z.jsx)(P.kC,{width:["100%","80%"],children:(0,z.jsx)(h.Translation,{translation:y.A[re].description,textAlign:["center","left"]})}),!n&&(0,z.jsx)(C.StrategyOverview,{showLoading:!1,strategies:[re]})]}),(0,z.jsx)(Z.Ee,{width:["60%","33%"],src:y.A[re].image}),n&&(0,z.jsx)(h.Translation,{translation:y.A[re].description,textAlign:["center","left"]}),n&&(0,z.jsx)(C.StrategyOverview,{showLoading:!1,strategies:[re]})]})]}):null}),[re,be,n]),Se=(0,b.useMemo)((function(){return te&&re?!fe||(0,w.xb)(fe)?(0,z.jsxs)(P.gC,{mt:10,spacing:4,width:["full","35%"],alignItems:"center",children:[(0,z.jsx)(h.Translation,{translation:"defi.noVaultsAvailable",textStyle:"ctaStatic",textAlign:"center"}),(0,z.jsx)(h.Translation,{translation:"strategies.".concat(y.A[re].strategy,".noVaultsAvailable"),params:{network:null===O||void 0===O?void 0:O.chainName},textAlign:"center",textStyle:"caption"}),(0,z.jsx)(S.SwitchNetworkButton,{chainId:1})]}):void 0:null}),[te,fe,re,O]);return(0,z.jsxs)(P.kC,{mt:14,width:"100%",direction:"column",alignItems:"center",children:[Ce,Se,ye,Ae]})}},88129:function(e,t,n){n.r(t),n.d(t,{StrategyOverview:function(){return m}});var s=n(1413),a=n(29439),i=n(21031),r=n(7276),l=n(86059),o=n(15542),c=n(1669),d=n(9597),u=n(3498),x=n(43127),p=n(89030),f=n(1494),g=n(45263),m=function(e){var t=e.textProps,n=e.showHeader,m=void 0===n||n,h=e.showLoading,j=void 0===h||h,v=e.strategies,y=(0,r.useState)(!0),A=(0,a.Z)(y,2),b=A[0],C=A[1],S=(0,c.w)(),w=S.isVaultsPositionsLoaded,I=S.vaultsPositions,P=(0,f.O)({assetIds:Object.keys(I),strategies:v}).compositions,T=(0,r.useMemo)((function(){return P.strategies.filter((function(e){return v.includes(e.extraData.strategy.type)})).reduce((function(e,t){return e.redeemable=e.redeemable.plus(t.value),e.earnings=e.earnings.plus(t.extraData.earnings),e.deposited=e.deposited.plus(t.extraData.deposited),e.realizedApy=e.realizedApy.plus((0,i.gA)(t.extraData.avgRealizedApy).times(t.value)),e}),{earnings:(0,i.gA)(0),deposited:(0,i.gA)(0),redeemable:(0,i.gA)(0),realizedApy:(0,i.gA)(0)})}),[P,v]);return T.realizedApy=T.realizedApy.div(T.redeemable),j||w&&!T.deposited.lte(0)?(0,g.jsxs)(u.gC,{spacing:6,alignItems:"flex-start",children:[m&&(0,g.jsxs)(u.Ug,{spacing:2,children:[(0,g.jsx)(o.Translation,{translation:"defi.yourWallet",textStyle:"heading",color:"primary",fontSize:"lg"}),(0,g.jsx)(x.zx,{variant:"unstyled",onClick:function(){return C((function(e){return!e}))},children:b?(0,g.jsx)(d.Zju,{size:24,color:"white"}):(0,g.jsx)(d.I0d,{size:24,color:"white"})})]}),(0,g.jsxs)(u.MI,{columns:3,spacing:[2,10],children:[(0,g.jsxs)(u.gC,{spacing:2,alignItems:"flex-start",children:[(0,g.jsx)(o.Translation,{translation:"defi.deposited",textStyle:"captionSmall",fontSize:["xs","sm"]}),(0,g.jsx)(p.N2,{noOfLines:2,isLoaded:!!w,minW:"100%",children:(0,g.jsx)(l.Amount.Usd,(0,s.Z)({value:T.deposited,textStyle:"ctaStatic",fontSize:"xl",lineHeight:"initial",sx:b?{}:{filter:"blur(7px)"}},t))})]}),(0,g.jsxs)(u.gC,{spacing:2,alignItems:"flex-start",children:[(0,g.jsx)(o.Translation,{translation:"defi.earnings",textStyle:"captionSmall",fontSize:["xs","sm"]}),(0,g.jsx)(p.N2,{noOfLines:2,isLoaded:!!w,minW:"100%",children:(0,g.jsx)(l.Amount.Usd,(0,s.Z)({value:T.earnings,textStyle:"ctaStatic",fontSize:"xl",lineHeight:"initial",sx:b?{}:{filter:"blur(7px)"}},t))})]}),(0,g.jsxs)(u.gC,{spacing:2,alignItems:"flex-start",children:[(0,g.jsx)(o.Translation,{translation:"defi.realizedApy",textStyle:"captionSmall",fontSize:["xs","sm"]}),(0,g.jsx)(p.N2,{noOfLines:2,isLoaded:!!w,minW:"100%",children:(0,g.jsx)(l.Amount.Percentage,(0,s.Z)({value:T.realizedApy,textStyle:"ctaStatic",fontSize:"xl",lineHeight:"initial",sx:b?{}:{filter:"blur(7px)"}},t))})]})]})]}):null}},96957:function(e,t,n){n.r(t),n.d(t,{StrategyTag:function(){return c}});var s=n(1413),a=n(45987),i=n(94586),r=n(15542),l=n(45263),o=["strategy"],c=function(e){var t=e.strategy,n=(0,a.Z)(e,o);return t?(0,l.jsx)(r.Translation,(0,s.Z)({px:4,py:"5.5px",component:i.Vp,fontWeight:600,color:"primary",bg:"tags.".concat(t),translation:"strategies.".concat(t,".label")},n)):null}},75349:function(e,t,n){n.r(t),n.d(t,{Minimal:function(){return C},VaultCard:function(){return S}});var s=n(1413),a=n(45987),i=n(7276),r=n(813),l=n(21031),o=n(95173),c=n(86059),d=n(55967),u=n(54447),x=n(61617),p=n(96957),f=n(15542),g=n(85267),m=n(1669),h=n(75712),j=n(3498),v=n(96699),y=n(45263),A=["assetId","fields","onClick","showDivider"],b=["asset","handleClick","onRowClick","isOpen"],C=function(e){var t=e.assetId,n=(0,o.s0)(),s=(0,m.w)().selectors.selectAssetById,a=(0,i.useMemo)((function(){if(s)return s(t)}),[t,s]);return(0,y.jsx)(h.AssetProvider,{wrapFlex:!1,assetId:t,children:(0,y.jsx)(u.Card,{p:4,layerStyle:["card","cardHover"],onClick:function(){return n((0,l.B$)(null===a||void 0===a?void 0:a.type,null===a||void 0===a?void 0:a.id))},children:(0,y.jsxs)(j.gC,{spacing:3,alignItems:"flex-start",children:[(0,y.jsxs)(j.Ug,{width:"full",justifyContent:"space-between",children:[(0,y.jsx)(x.AssetLabel,{assetId:t,size:"sm"}),(0,y.jsx)(h.AssetProvider.GeneralData,{size:"xs",field:"strategies"})]}),(0,y.jsxs)(j.MI,{pt:3,columns:2,width:"100%",borderTop:"1px solid",borderTopColor:"divider",children:[(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.apy",textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.Apy,{showTooltip:!1,textStyle:"tableCell"})]}),(0,y.jsx)(j.gC,{spacing:1,alignItems:"flex-end",justifyContent:"flex-end",children:(0,y.jsx)(h.AssetProvider.Protocols,{size:"xs",children:(0,y.jsx)(h.AssetProvider.GeneralData,{field:"protocol",size:"xs",fontSize:"sm"})})})]})]})})})},S=function(e){var t=e.assetId,n=e.onClick,s=(0,o.s0)(),a=(0,g.m)().location,l=(0,m.w)().selectors.selectAssetById,c=(0,i.useMemo)((function(){if(l)return l(t)}),[t,l]),d=(0,i.useMemo)((function(){var e;return null!==c&&void 0!==c&&null!==(e=c.vaultPosition)&&void 0!==e&&e.usd.deposited?(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.deposited",textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.DepositedUsd,{textStyle:"tableCell"})]}):"BY"===(null===c||void 0===c?void 0:c.type)?(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.protocols",textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.Protocols,{iconMargin:-1,size:"xs"})]}):(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.rewards",textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.Rewards,{iconMargin:-1,size:"xs"})]})}),[c]);return(0,y.jsx)(h.AssetProvider,{wrapFlex:!1,assetId:t,children:(0,y.jsx)(u.Card,{p:4,onClick:function(){return n?n():s("".concat(null===a||void 0===a?void 0:a.pathname,"/").concat(t))},children:(0,y.jsxs)(j.gC,{spacing:3,alignItems:"flex-start",children:[(0,y.jsxs)(j.Ug,{width:"full",justifyContent:"space-between",children:[(0,y.jsx)(x.AssetLabel,{assetId:t,size:"sm",extraFields:"tranches"===r.A2[c.type].strategy?["strategyBadge"]:[]}),"tranches"===r.A2[c.type].strategy&&(0,y.jsx)(h.AssetProvider.GeneralData,{size:"xs",field:"protocolWithVariant"})]}),(0,y.jsxs)(j.MI,{pt:3,pl:4,columns:3,width:"100%",borderTop:"1px solid",borderTopColor:"divider",children:[(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.pool",textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.PoolUsd,{textStyle:"tableCell"})]}),(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.apy",textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.Apy,{textStyle:"tableCell"})]}),d]})]})})})};S.Stats=function(e){var t,n,i=e.asset,l=e.handleClick,o=e.onRowClick,g=e.isOpen,m=(0,a.Z)(e,b),A=(0,v.Fg)();return(0,y.jsx)(h.AssetProvider,{wrapFlex:!1,assetId:i.id,children:(0,y.jsxs)(j.gC,{spacing:2,width:"full",children:[(0,y.jsx)(u.Card,(0,s.Z)((0,s.Z)({p:4,onClick:function(){return l(i)},backgroundColor:g?"card.bgLight":"card.bg"},m),{},{children:(0,y.jsxs)(j.gC,{spacing:3,alignItems:"flex-start",children:[(0,y.jsxs)(j.Ug,{width:"full",justifyContent:"space-between",children:[(0,y.jsx)(x.AssetLabel,{assetId:i.id,size:"sm"}),(null===i||void 0===i?void 0:i.strategy)&&(0,y.jsx)(p.StrategyTag,{strategy:i.strategy})]}),(0,y.jsxs)(j.Ug,{pt:3,px:4,width:"100%",borderTop:"1px solid",borderTopColor:"divider",justifyContent:"space-between",children:[(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.pool",textStyle:"captionSmall"}),(0,y.jsx)(c.Amount.Usd,{value:i.tvlUsd,textStyle:"tableCell"})]}),(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-end",children:[(0,y.jsx)(f.Translation,{translation:"defi.apy",textStyle:"captionSmall"}),(0,y.jsxs)(j.Ug,{spacing:1,children:[(0,y.jsx)(c.Amount.Percentage,{value:(null===(t=i.apyRange)||void 0===t?void 0:t.minApy)||null,textStyle:"tableCell"}),(0,y.jsx)(j.xv,{children:"-"}),(0,y.jsx)(c.Amount.Percentage,{value:(null===(n=i.apyRange)||void 0===n?void 0:n.maxApy)||null,textStyle:"tableCell"})]})]})]})]})})),g&&(0,y.jsx)(j.gC,{spacing:2,width:"full",children:i.subRows.map((function(e){return(0,y.jsx)(h.AssetProvider,{wrapFlex:!1,assetId:e.id,children:(0,y.jsx)(u.Card,{py:2,pr:1,pl:[4,6],layerStyle:["card"],backgroundColor:"card.bgLight",onClick:function(){return o(e)},children:(0,y.jsxs)(j.Ug,{width:"100%",justifyContent:"space-between",children:[["AA","BB"].includes(e.type)?(0,y.jsxs)(j.Ug,{width:"100%",justifyContent:"space-between",children:[(0,y.jsx)(h.AssetProvider.GeneralData,{field:"protocolWithVariant",size:"xs"}),(0,y.jsxs)(j.Ug,{spacing:1,children:[(0,y.jsx)(h.AssetProvider.SeniorApy,{color:r.A2.AA.color,textStyle:"tableCell"}),(0,y.jsx)(j.xv,{children:"-"}),(0,y.jsx)(h.AssetProvider.JuniorApy,{color:r.A2.BB.color,textStyle:"tableCell"})]})]}):"BY"===e.type&&(0,y.jsxs)(j.Ug,{width:"100%",justifyContent:"space-between",children:[(0,y.jsxs)(j.Ug,{flex:1,children:[(0,y.jsx)(j.kC,{width:"40%",children:(0,y.jsx)(h.AssetProvider.GeneralData,{field:"protocols",size:"xs"})}),(0,y.jsx)(h.AssetProvider.GeneralData,{field:"strategies"})]}),(0,y.jsx)(h.AssetProvider.Apy,{showTooltip:!1,textStyle:"tableCell"})]}),(0,y.jsx)(d.AeI,{size:24,color:A.colors.primary})]})})})}))})]})})},S.Inline=function(e){var t=e.assetId,n=e.fields,r=e.onClick,l=e.showDivider,o=void 0===l||l,c=(0,a.Z)(e,A);return(0,y.jsx)(h.AssetProvider,{wrapFlex:!1,assetId:t,children:(0,y.jsx)(u.Card,(0,s.Z)((0,s.Z)({py:2,px:4,layerStyle:["card","cardHover"],onClick:r},c),{},{children:(0,y.jsx)(j.Ug,{width:"100%",justifyContent:"space-between",children:(0,y.jsxs)(j.Ug,{spacing:3,width:"100%",alignItems:"center",children:[(0,y.jsx)(h.AssetProvider.Icon,{size:"xs"}),n.map((function(e,t){return(0,y.jsxs)(i.Fragment,{children:[o&&(0,y.jsx)(j.xu,{width:1,height:1,bg:"divider",borderRadius:"50%"}),(0,y.jsxs)(j.Ug,(0,s.Z)((0,s.Z)({spacing:2},e.parentProps),{},{children:["right"!==e.labelPos&&e.label&&(0,y.jsx)(f.Translation,{translation:e.label,component:j.xv,textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.GeneralData,(0,s.Z)({field:e.field,textStyle:"tableCell"},e.props)),"right"===e.labelPos&&e.label&&(0,y.jsx)(f.Translation,{translation:e.label,component:j.xv,textStyle:"captionSmall"})]}))]},"field_".concat(t))}))]})})}))})},S.Minimal=C,S.Tranche=function(e){var t=e.assetId,n=e.onClick,s=(0,o.s0)(),a=(0,g.m)().location,l=(0,m.w)().selectors,d=l.selectAssetById,p=l.selectVaultById,v=(0,i.useMemo)((function(){if(p)return p(t)}),[t,p]),A=(0,i.useMemo)((function(){if(d)return d(t)}),[t,d]),b=(0,i.useMemo)((function(){return d(null===v||void 0===v?void 0:v.vaultConfig.Tranches.AA.address)}),[v,d]),C=(0,i.useMemo)((function(){return d(null===v||void 0===v?void 0:v.vaultConfig.Tranches.BB.address)}),[v,d]);return(0,y.jsx)(h.AssetProvider,{wrapFlex:!1,assetId:A.id,children:(0,y.jsx)(j.gC,{spacing:2,width:"full",children:(0,y.jsx)(u.Card,{p:4,onClick:function(){return n?n():s("".concat(null===a||void 0===a?void 0:a.pathname,"/").concat(t))},children:(0,y.jsxs)(j.gC,{spacing:3,alignItems:"flex-start",children:[(0,y.jsxs)(j.Ug,{width:"full",justifyContent:"space-between",children:[(0,y.jsx)(x.AssetLabel,{assetId:A.id,size:"sm",extraFields:["statusBadge"]}),"tranches"===r.A2[A.type].strategy&&(0,y.jsx)(h.AssetProvider.GeneralData,{size:"xs",field:"protocolWithVariant"})]}),(0,y.jsxs)(j.Ug,{pt:3,px:4,width:"100%",borderTop:"1px solid",borderTopColor:"divider",justifyContent:"space-between",children:[(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-start",children:[(0,y.jsx)(f.Translation,{translation:"defi.pool",textStyle:"captionSmall"}),(0,y.jsx)(h.AssetProvider.TrancheTotalPoolUsd,{textStyle:"tableCell"})]}),(0,y.jsxs)(j.gC,{spacing:1,alignItems:"flex-end",children:[(0,y.jsx)(f.Translation,{translation:"defi.apy",textStyle:"captionSmall"}),(0,y.jsxs)(j.Ug,{spacing:1,children:[(0,y.jsx)(c.Amount.Percentage,{value:(null===b||void 0===b?void 0:b.apy)||null,textStyle:"tableCell"}),(0,y.jsx)(j.xv,{children:"-"}),(0,y.jsx)(c.Amount.Percentage,{value:(null===C||void 0===C?void 0:C.apy)||null,textStyle:"tableCell"})]})]})]})]})})})})}},1494:function(e,t,n){n.d(t,{O:function(){return u}});var s=n(93433),a=n(4942),i=n(1413),r=n(7276),l=n(21031),o=n(79681),c=n(12056),d=n(1669),u=function(e){var t=e.assetIds,n=e.strategies,u=(0,o.qM)(),x=(0,d.w)().selectors,p=x.selectAssetById,f=x.selectAssetsByIds,g=(0,r.useMemo)((function(){return f?f(t):[]}),[t,f]),m=Object.keys(c.A).reduce((function(e,t){return(0,i.Z)((0,i.Z)({},e),{},(0,a.Z)({},t,{balance:(0,l.gA)(0),earnings:(0,l.gA)(0),deposited:(0,l.gA)(0),weightedRealizedApy:(0,l.gA)(0)}))}),{}),h=(0,r.useMemo)((function(){return g.filter((function(e){return e.type&&(!n||n.includes(e.type))})).reduce((function(e,t){var n;return t.type&&t.vaultPosition?(e[t.type].earnings=e[t.type].earnings.plus(t.vaultPosition.usd.earnings),e[t.type].balance=e[t.type].balance.plus(t.vaultPosition.usd.redeemable),e[t.type].deposited=e[t.type].deposited.plus(t.vaultPosition.usd.deposited),(0,l.gA)(null===(n=t.vaultPosition)||void 0===n?void 0:n.realizedApy).gt(0)&&(e[t.type].weightedRealizedApy=e[t.type].weightedRealizedApy.plus(t.vaultPosition.realizedApy.times(t.vaultPosition.usd.redeemable))),e):e}),m)}),[g,n,m]),j=(0,r.useMemo)((function(){return g.filter((function(e){return e.type&&(!n||n.includes(e.type))})).reduce((function(e,t){if(!t.underlyingId||!t.vaultPosition)return e;var n=p(t.underlyingId);return n?(e[n.id]||(e[n.id]=(0,l.gA)(0)),e[n.id]=e[n.id].plus(t.vaultPosition.usd.redeemable),e):e}),{})}),[g,n,p]),v={assets:[],strategies:[]};v.strategies=(0,r.useMemo)((function(){return Object.keys(h).map((function(e){return{label:u(c.A[e].label),extraData:{avgRealizedApy:h[e].balance.gt(0)?parseFloat(h[e].weightedRealizedApy.div(h[e].balance)):0,strategy:c.A[e],earnings:parseFloat(h[e].earnings),deposited:parseFloat(h[e].deposited)},value:parseFloat(h[e].balance)}}))}),[h,u]),v.assets=(0,r.useMemo)((function(){return Object.keys(j).reduce((function(e,t){var a=p(t);return!a||a.type&&(!n||n.includes(a.type))?e:[].concat((0,s.Z)(e),[{label:a.name,extraData:{asset:a},value:parseFloat(j[t])}])}),[])}),[j,p,n]);var y={assets:{},strategies:{}};return y.strategies=(0,r.useMemo)((function(){return Object.values(c.A).reduce((function(e,t){var n=u(t.label);return(0,i.Z)((0,i.Z)({},e),{},(0,a.Z)({},n,t.color))}),{})}),[u]),y.assets=(0,r.useMemo)((function(){return Object.keys(j).reduce((function(e,t){var n=p(t);if(!n)return e;var s=n.name;return(0,i.Z)((0,i.Z)({},e),{},(0,a.Z)({},s,n.color))}),{})}),[j,p]),{colors:y,compositions:v}}},82137:function(e,t,n){n.d(t,{Jf:function(){return b},kN:function(){return j},uY:function(){return A}});var s=n(45987),a=n(1413),i=n(29439),r=n(7276),l=n(32390),o=n(96699),c=n(2548),d=n(7828),u=["className","children"],x=["type","aria-label"],p=function(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return t.filter(Boolean).join(" ")},f=(0,c.k)({name:"StatStylesContext",errorMessage:"useStatStyles returned is 'undefined'. Seems you forgot to wrap the components in \"<Stat />\" "}),g=(0,i.Z)(f,2),m=g[0],h=g[1],j=(0,o.Gp)((function(e,t){var n=(0,o.jC)("Stat",e),i=(0,a.Z)({position:"relative",flex:"1 1 0%"},n.container),l=(0,d.Lr)(e),c=l.className,x=l.children,f=(0,s.Z)(l,u);return r.createElement(m,{value:n},r.createElement(o.m$.div,(0,a.Z)((0,a.Z)({ref:t},f),{},{className:p("chakra-stat",c),__css:i}),r.createElement("dl",null,x)))}));j.displayName="Stat";var v=function(e){return r.createElement(l.JO,(0,a.Z)({color:"red.400"},e),r.createElement("path",{fill:"currentColor",d:"M21,5H3C2.621,5,2.275,5.214,2.105,5.553C1.937,5.892,1.973,6.297,2.2,6.6l9,12 c0.188,0.252,0.485,0.4,0.8,0.4s0.611-0.148,0.8-0.4l9-12c0.228-0.303,0.264-0.708,0.095-1.047C21.725,5.214,21.379,5,21,5z"}))};function y(e){return r.createElement(l.JO,(0,a.Z)({color:"green.400"},e),r.createElement("path",{fill:"currentColor",d:"M12.8,5.4c-0.377-0.504-1.223-0.504-1.6,0l-9,12c-0.228,0.303-0.264,0.708-0.095,1.047 C2.275,18.786,2.621,19,3,19h18c0.379,0,0.725-0.214,0.895-0.553c0.169-0.339,0.133-0.744-0.095-1.047L12.8,5.4z"}))}function A(e){var t=e.type,n=e["aria-label"],i=(0,s.Z)(e,x),l=h(),c="increase"===t?y:v,d=n||("increase"===t?"increased by":"decreased by");return r.createElement(r.Fragment,null,r.createElement(o.m$.span,{srOnly:!0},d),r.createElement(c,(0,a.Z)((0,a.Z)({"aria-hidden":!0},i),{},{__css:l.icon})))}v.displayName="StatDownArrow",y.displayName="StatUpArrow",A.displayName="StatArrow",(0,o.Gp)((function(e,t){return r.createElement(o.m$.div,(0,a.Z)((0,a.Z)({},e),{},{ref:t,role:"group",className:p("chakra-stat__group",e.className),__css:{display:"flex",flexWrap:"wrap",justifyContent:"space-around",alignItems:"flex-start"}}))})).displayName="StatGroup",(0,o.Gp)((function(e,t){var n=h();return r.createElement(o.m$.dd,(0,a.Z)((0,a.Z)({ref:t},e),{},{className:p("chakra-stat__help-text",e.className),__css:n.helpText}))})).displayName="StatHelpText",(0,o.Gp)((function(e,t){var n=h();return r.createElement(o.m$.dt,(0,a.Z)((0,a.Z)({ref:t},e),{},{className:p("chakra-stat__label",e.className),__css:n.label}))})).displayName="StatLabel";var b=(0,o.Gp)((function(e,t){var n=h();return r.createElement(o.m$.dd,(0,a.Z)((0,a.Z)({ref:t},e),{},{className:p("chakra-stat__number",e.className),__css:(0,a.Z)((0,a.Z)({},n.number),{},{fontFeatureSettings:"pnum",fontVariantNumeric:"proportional-nums"})}))}));b.displayName="StatNumber"}}]);