"use strict";(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[7690,110],{63330:function(t,e,n){n.r(e),n.d(e,{AssetPage:function(){return M}});var s=n(1413),a=n(29439),i=n(76566),r=n(16120),o=n(95173),l=n(98428),c=n(66288),d=n(86698),u=n(61617),x=n(97901),m=n(96362),p=n(15542),g=n(98365),f=n(85267),h=n(1669),v=n(75712),j=n(60110),w=n(7276),y=n(99594),b=n(61925),S=n(88089),C=n(3498),A=n(37658),I=n(44888),T=n(45263),M=function(){var t=(0,o.s0)(),e=(0,c.X)(),n=e.isMobile,M=e.environment,k=(0,f.m)(),Z=k.params,P=k.location,D=k.searchParams,E=(0,w.useState)(0),U=(0,a.Z)(E,2),z=U[0],B=U[1],G=(0,w.useState)(0),F=(0,a.Z)(G,2),_=F[0],L=F[1],W=(0,w.useState)(),O=(0,a.Z)(W,2),R=O[0],H=O[1],V=(0,w.useMemo)((function(){return D}),[D]),N=(0,a.Z)(V,2),q=N[0],K=N[1],X=(0,w.useState)(I.WE["6MONTHS"]),Q=(0,a.Z)(X,2),Y=Q[0],$=Q[1],J=(0,h.w)(),tt=J.isPortfolioLoaded,et=J.portfolioTimestamp,nt=J.assetsDataTimestamp,st=J.isPortfolioAccountReady,at=J.selectors,it=at.selectAssetById,rt=at.selectVaultById,ot=at.selectVaultGauge,lt=at.selectAssetBalance,ct=at.selectAssetPriceUsd,dt=(0,w.useMemo)((function(){return Object.keys(I.A2).find((function(t){return I.A2[t].route===Z.strategy}))}),[Z]),ut=(0,w.useMemo)((function(){return it&&it(Z.asset)}),[it,Z.asset]),xt=(0,w.useMemo)((function(){return rt&&rt(Z.asset)}),[rt,Z.asset]);(0,w.useEffect)((function(){ut&&L(Date.now())}),[ut]);var mt=(0,w.useMemo)((function(){if(!ut||!lt||null===ut||void 0===ut||!ut.underlyingId||!ct)return(0,y.gA)(0);var t=lt(ut.underlyingId),e=ct(ut.underlyingId);return(0,y.d5)(t).times((0,y.d5)(e))}),[ut,lt,ct]),pt=(0,w.useMemo)((function(){return ot&&ot(Z.asset)}),[ot,Z.asset]),gt=(0,w.useMemo)((function(){return pt&&it&&it(pt.id)}),[it,pt]),ft=(0,w.useMemo)((function(){var t;return gt&&"gaugeData"in gt&&null!==(t=gt.gaugeData)&&void 0!==t&&t.rewards?Object.values(gt.gaugeData.rewards).reduce((function(t,e){return t.plus((0,y.d5)(e.balance))}),(0,y.gA)(0)):(0,y.gA)(0)}),[gt]);(0,w.useEffect)((function(){if(tt&&it&&P&&_)return ut?void 0:t(P.pathname.replace("/".concat(Z.asset),""))}),[tt,it,_,ut,Z.asset,P,t]),(0,w.useEffect)((function(){!(st&&ut&&R!==(null===ut||void 0===ut?void 0:ut.id)&&et&&nt)||et>nt||nt>_||((0,y.AV)(ut,mt),H(ut.id))}),[ut,et,mt,nt,st,_,R,H]);var ht=(0,w.useMemo)((function(){var t=[{id:"earn",label:"navBar.earn",component:i.Earn,actions:[{type:"deposit",component:x.Deposit,label:"common.deposit",steps:[{type:"approve",component:m.Approve,label:"modals.approve.header"}]},{type:"withdraw",label:"common.withdraw",component:g.Withdraw,steps:[]}]}],e=pt&&"enabled"in pt&&!pt.enabled;pt&&(!e||(0,y.d5)(null===gt||void 0===gt?void 0:gt.balance).gt(0)||(0,y.d5)(ft).gt(0))&&t.push({id:"gauge",label:"navBar.gauge",component:r.GaugeStaking,icon:e&&((0,y.gA)(null===gt||void 0===gt?void 0:gt.balance).gt(0)||(0,y.d5)(ft).gt(0))?{src:"".concat(I.pm,"vaults/deprecated.png"),tooltip:"trade.vaults.GG.disabled",props:{width:5,height:5}}:null,actions:[{type:"stake",component:x.Deposit,label:"common.stake",steps:[{type:"approve",component:m.Approve,label:"modals.approve.header"}]},{type:"unstake",label:"common.unstake",component:g.Withdraw,steps:[]}]});var n=!(null!==xt&&void 0!==xt&&xt.flags)||void 0===xt.flags.statsEnabled||xt.flags.statsEnabled;return(0,y.xW)("stats",M)&&n&&t.push({id:"stats",label:"navBar.stats",component:d.AssetStats,componentProps:{timeframe:Y,assetOnly:!0,showHeader:!1,showAssetStrategy:!0}}),t}),[xt,pt,gt,Y,M,ft]),vt=(0,w.useMemo)((function(){return q.get("tab")}),[q]);(0,w.useEffect)((function(){if(vt){var t=ht.find((function(t){return t.id.toString()===vt.toString()}));if(t){var e=ht.indexOf(t);B(e)}else B(0)}else B(0)}),[ht,vt,B]);var jt=(0,w.useMemo)((function(){return ht[z]&&"gauge"===ht[z].id&&pt?pt.id:null===ut||void 0===ut?void 0:ut.id}),[ht,z,ut,pt]),wt=(0,w.useMemo)((function(){return ht[z]}),[ht,z]),yt=(0,w.useMemo)((function(){return wt.component}),[wt]),bt=(0,w.useCallback)((function(t){var e=ht[t];e&&K("?tab=".concat(e.id))}),[ht,K]),St=(0,w.useMemo)((function(){return(0,T.jsx)(S.mQ,{variant:"unstyled",index:z,width:["100%","auto"],children:(0,T.jsx)(S.td,{children:ht.map((function(t,e){return(0,T.jsx)(l.IconTab,{width:["".concat(100/ht.length,"%"),"auto"],icon:t.icon,onClick:function(){return bt(e)},children:(0,T.jsx)(p.Translation,{translation:t.label})},"tab_".concat(e))}))})})}),[ht,bt,z]),Ct=(0,w.useMemo)((function(){return wt.actions?(0,T.jsx)(A.InteractiveComponent,{vaultId:null===ut||void 0===ut?void 0:ut.id,assetId:jt,actions:wt.actions}):null}),[wt,ut,jt]),At=(0,w.useMemo)((function(){return"stats"===wt.id?(0,T.jsx)(b.TimeframeSelector,{style:{marginTop:"-20px"},variant:"button",timeframe:Y,setTimeframe:$,width:["100%","auto"],justifyContent:["center","initial"]}):!n&&(0,T.jsx)(j.StrategyLabel,{strategy:dt,color:"cta",textStyle:"italic"})}),[wt,dt,n,Y,$]);return(0,T.jsx)(v.AssetProvider,{wrapFlex:!0,assetId:Z.asset,children:(0,T.jsxs)(C.xu,{width:"100%",children:[(0,T.jsx)(C.kC,{my:[10,14],width:"100%",id:"asset-top-header",direction:["column","row"],justifyContent:["center","space-between"],children:(0,T.jsxs)(C.Kq,{width:"100%",spacing:[7,10],alignItems:"center",justifyContent:"center",direction:["column","row"],children:[(0,T.jsx)(u.AssetLabel,{assetId:Z.asset,fontSize:"h2"}),(0,T.jsxs)(C.Kq,{flex:1,direction:"row",width:["100%","auto"],borderBottom:"1px solid",borderColor:"divider",justifyContent:"space-between",children:[St,At]})]})}),(0,T.jsxs)(C.Ug,{width:"100%",spacing:[0,10],alignItems:"space-between",children:[(0,T.jsx)(C.Kq,{flex:1,mb:[20,0],spacing:10,width:["100%",.7],children:(0,T.jsx)(yt,(0,s.Z)({},ht[z].componentProps))}),Ct]})]})})}},16120:function(t,e,n){n.r(e),n.d(e,{GaugeStaking:function(){return v}});var s=n(29439),a=n(54447),i=n(44888),r=n(86059),o=n(7276),l=n(15542),c=n(1669),d=n(85267),u=n(99594),x=n(75712),m=n(3148),p=n(72258),g=n(3498),f=n(30422),h=n(45263),v=function(){var t,e,n,v,j,w=(0,d.m)().params,y=(0,o.useState)(0),b=(0,s.Z)(y,2),S=b[0],C=b[1],A=(0,o.useState)(),I=(0,s.Z)(A,2),T=I[0],M=I[1],k=(0,c.w)(),Z=k.portfolioTimestamp,P=k.assetsDataTimestamp,D=k.isPortfolioAccountReady,E=k.selectors,U=E.selectAssetById,z=E.selectVaultGauge,B=E.selectAssetBalance,G=E.selectAssetPriceUsd,F=(0,o.useMemo)((function(){return U&&U(w.asset)}),[U,w.asset]),_=(0,o.useMemo)((function(){return F&&z&&z(F.id)}),[z,F]),L=(0,o.useMemo)((function(){return U&&_&&U(_.id)}),[_,U]),W=(0,o.useMemo)((function(){return Object.keys(i.A2).find((function(t){return i.A2[t].route===w.strategy}))}),[w]),O=(0,o.useMemo)((function(){return W&&i.A2[W].color}),[W]),R=(0,o.useMemo)((function(){if(!_)return null;var t=i.A2[_.type];return null!==t&&void 0!==t&&t.carouselItems?(0,h.jsx)(f.StrategyDescriptionCarousel,{color:O,strategy:_.type,delay:1e4}):null}),[_,O]),H=(0,o.useMemo)((function(){var t;return(null===L||void 0===L?void 0:L.vaultPosition)&&(0,u.gA)(null===L||void 0===L||null===(t=L.vaultPosition)||void 0===t?void 0:t.underlying.redeemable).div(L.totalSupply)}),[L]),V=(0,o.useMemo)((function(){if(!L||null===L||void 0===L||!L.underlyingId||!B||!G)return(0,u.gA)(0);var t=B(L.underlyingId),e=G(L.underlyingId);return(0,u.d5)(t).times((0,u.d5)(e))}),[L,B,G]),N=(0,o.useMemo)((function(){return _&&"description"in _&&_.description?(0,h.jsx)(a.Card.Dark,{children:(0,h.jsx)(g.xv,{dangerouslySetInnerHTML:{__html:_.description}})}):null}),[_]);return(0,o.useEffect)((function(){L&&C(Date.now())}),[L]),(0,o.useEffect)((function(){!(D&&L&&T!==(null===L||void 0===L?void 0:L.id)&&Z&&P)||Z>P||P>S||((0,u.AV)(L,V),M(L.id))}),[L,Z,V,P,D,S,T,M]),(0,h.jsxs)(g.gC,{spacing:10,width:"100%",children:[N,L.vaultPosition&&(0,h.jsx)(x.AssetProvider,{wrapFlex:!1,assetId:_.id,children:(0,h.jsxs)(g.MI,{width:"100%",columns:[2,4],spacing:[10,14],alignItems:"flex-start",children:[(0,h.jsxs)(g.gC,{spacing:2,justifyContent:"center",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.deposited",textStyle:"titleSmall"}),(0,h.jsxs)(g.Ug,{spacing:1,alignItems:"baseline",children:[(0,h.jsx)(x.AssetProvider.Deposited,{textStyle:"heading",fontSize:"h3"}),(0,h.jsx)(x.AssetProvider.Name,{textStyle:"heading",fontSize:"h3"})]})]}),(0,h.jsxs)(g.gC,{spacing:2,justifyContent:"center",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.share",textStyle:"titleSmall"}),(0,h.jsx)(x.AssetProvider.GaugeShare,{minValue:.01,textStyle:"heading",fontSize:"h3"})]}),(0,h.jsxs)(g.gC,{spacing:2,justifyContent:"center",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.idleDistribution",textStyle:"titleSmall"}),(0,h.jsxs)(g.Ug,{spacing:1,alignItems:"baseline",children:[(0,h.jsx)(x.AssetProvider.GaugeUserDistribution,{suffix:" ".concat(null===(t=_.rewardToken)||void 0===t?void 0:t.token),textStyle:"heading",fontSize:"h3"}),(0,h.jsx)(l.Translation,{component:g.xv,translation:["/","common.day"],textStyle:"captionSmall",textTransform:"lowercase"})]})]}),(0,h.jsxs)(g.gC,{spacing:2,justifyContent:"center",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.additionalRewards",textStyle:"titleSmall"}),(0,h.jsx)(g.gC,{spacing:2,children:(null===(e=_.multiRewardsTokens)||void 0===e?void 0:e.length)>0?Object.keys(null===(n=L.gaugeData)||void 0===n?void 0:n.rewards).map((function(t){var e=L.gaugeData.rewards[t];if(t===_.rewardToken.address)return null;var n=U(t);return(0,h.jsxs)(g.Ug,{spacing:1,alignItems:"baseline",children:[(0,h.jsx)(r.Amount,{value:e.rate.times(H),suffix:" ".concat(n.token),textStyle:"heading",fontSize:"h3"}),(0,h.jsx)(l.Translation,{component:g.xv,translation:["/","common.day"],textStyle:"captionSmall",textTransform:"lowercase"})]},"reward_".concat(t))})):(0,h.jsx)(g.xv,{textStyle:"heading",fontSize:"h3",children:"-"})})]})]})}),(0,h.jsxs)(g.gC,{spacing:6,width:"100%",alignItems:"flex-start",children:[(0,h.jsx)(l.Translation,{component:g.X6,as:"h3",size:"md",translation:"defi.rewards"}),(0,h.jsx)(g.gC,{spacing:4,width:"100%",children:(0,u.xb)(null===(v=L.gaugeData)||void 0===v?void 0:v.rewards)?null:Object.keys(null===(j=L.gaugeData)||void 0===j?void 0:j.rewards).map((function(t){var e=L.gaugeData.rewards[t],n=_.getClaimRewardsContractSendMethod(t);return(0,h.jsx)(x.AssetProvider,{wrapFlex:!1,assetId:t,children:(0,h.jsx)(a.Card,{p:6,px:8,width:"100%",children:(0,h.jsxs)(g.Kq,{width:"100%",spacing:[4,0],alignItems:"center",direction:["column","row"],justifyContent:"space-between",children:[(0,h.jsxs)(g.MI,{width:"100%",spacing:[6,0],columns:[2,4],children:[(0,h.jsxs)(g.gC,{spacing:2,alignItems:"flex-start",justifyContent:"flex-start",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.asset",textStyle:"captionSmall"}),(0,h.jsx)(x.AssetProvider.GeneralData,{size:"xs",field:"asset"})]}),(0,h.jsxs)(g.gC,{spacing:2,alignItems:"flex-start",justifyContent:"flex-start",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.apy",textStyle:"captionSmall"}),(0,h.jsx)(r.Amount.Percentage,{textStyle:"tableCell",value:e.apr})]}),(0,h.jsxs)(g.gC,{spacing:2,alignItems:"flex-start",justifyContent:"flex-start",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.dailyDistribution",textStyle:"captionSmall"}),(0,h.jsxs)(g.Ug,{spacing:1,width:"100%",children:[(0,h.jsx)(r.Amount,{textStyle:"tableCell",value:e.rate}),(0,h.jsx)(x.AssetProvider.Name,{textStyle:"tableCell"})]})]}),(0,h.jsxs)(g.gC,{spacing:2,alignItems:"flex-start",justifyContent:"flex-start",children:[(0,h.jsx)(l.Translation,{component:g.xv,translation:"defi.claimable",textStyle:"captionSmall"}),(0,h.jsxs)(g.Ug,{spacing:1,width:"100%",children:[(0,h.jsx)(r.Amount,{textStyle:"tableCell",value:e.balance}),(0,h.jsx)(x.AssetProvider.Name,{textStyle:"tableCell"})]})]})]}),(0,h.jsx)(p.TransactionButton,{text:"defi.claim",vaultId:F.id,assetId:t,contractSendMethod:n,actionType:"claim",amount:e.balance.toString(),width:["100%","150px"],disabled:e.balance.lte(0)})]})})},"reward_".concat(t))}))})]}),(0,h.jsx)(m.AssetGeneralData,{assetId:null===_||void 0===_?void 0:_.id}),R]})}},98428:function(t,e,n){n.r(e),n.d(e,{IconTab:function(){return m}});var s=n(1413),a=n(7276),i=n(79681),r=n(88089),o=n(96699),l=n(43127),c=n(3498),d=n(70820),u=n(2092),x=n(45263),m=a.forwardRef((function(t,e){var n=(0,i.qM)(),a=(0,r.xD)((0,s.Z)((0,s.Z)({},t),{},{ref:e})),m=(0,o.jC)("Tabs",(0,s.Z)((0,s.Z)({},a),{},{variant:"unstyled"}));return(0,x.jsx)(l.zx,(0,s.Z)((0,s.Z)({background:"transparent",borderRadius:0,__css:m.tab},a),{},{children:(0,x.jsxs)(c.Ug,{spacing:2,width:"full",justifyContent:"center",children:[a.children,t.icon&&(0,x.jsx)(d.u,{hasArrow:!0,placement:"top",label:t.icon.tooltip?n(t.icon.tooltip):"",children:(0,x.jsx)(u.Ee,(0,s.Z)({src:t.icon.src},t.icon.props))})]})}))}))},37658:function(t,e,n){n.r(e),n.d(e,{InteractiveComponent:function(){return m}});var s=n(29439),a=n(7276),i=n(55967),r=n(66288),o=n(15542),l=n(3498),c=n(43127),d=n(18147),u=n(4710),x=n(45263),m=function(t){var e=t.assetId,n=t.vaultId,m=t.actions,p=(0,r.X)().isMobile,g=(0,a.useState)(!1),f=(0,s.Z)(g,2),h=f[0],v=f[1],j=(0,a.useState)(!1),w=(0,s.Z)(j,2),y=w[0],b=w[1];return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsxs)(l.gC,{left:0,zIndex:[40,0],spacing:[0,6],id:"right-side",width:["100vw","27em"],height:["100vh","auto"],position:["fixed","relative"],top:[h?0:"100vh",0],bg:p?"rgba(0, 0, 0, 0.5)":void 0,sx:p?{transition:"top 0.3s ease-in-out"}:{},children:[(0,x.jsxs)(l.gC,{bottom:0,spacing:0,width:"100%",height:["100vh","auto"],position:["fixed","relative"],top:[h?0:"100vh",0],sx:p?{transition:"top 0.3s ease-in-out"}:{},children:[p&&(0,x.jsxs)(l.Ug,{px:4,py:2,bg:"card.bg",width:"100%",borderBottom:"1px solid",borderBottomColor:"divider",justifyContent:"space-between",children:[(0,x.jsx)(o.Translation,{alignItems:"center",display:"flex",variant:"unstyled",translation:"common.exit",component:c.zx,leftIcon:(0,x.jsx)(i.sG8,{size:24}),onClick:function(){return v(!1)}}),(0,x.jsx)(o.Translation,{alignItems:"center",display:"flex",variant:"unstyled",translation:["common.show","navBar.transactions"],component:c.zx,onClick:function(){return b(!0)}})]}),(0,x.jsx)(u.OperativeComponent,{flex:1,minHeight:p?"auto":"590px",borderRadius:p?0:void 0,assetId:e,actions:m})]}),(0,x.jsxs)(l.gC,{flex:1,bottom:0,spacing:0,width:"100%",height:["100vh","auto"],position:["fixed","relative"],top:[y?0:"100vh",0],sx:p?{transition:"top 0.3s ease-in-out"}:{},children:[p&&(0,x.jsxs)(l.Ug,{px:4,py:2,bg:"card.bg",width:"100%",borderBottom:"1px solid",borderBottomColor:"divider",justifyContent:"space-between",children:[(0,x.jsx)(o.Translation,{alignItems:"center",display:"flex",variant:"unstyled",translation:"common.back",component:c.zx,leftIcon:(0,x.jsx)(i.sG8,{size:24}),onClick:function(){return b(!1)}}),(0,x.jsx)(o.Translation,{textStyle:"ctaStatic",translation:"assets.assetDetails.assetHistory.transactionHistory",component:l.xv})]}),(0,x.jsx)(d.TransactionList,{assetIds:[n],fullHeightOnMobile:!0,maxH:["100%",600]})]})]}),p&&(0,x.jsx)(l.kC,{p:4,left:0,bottom:0,border:0,width:"100%",zIndex:[10,0],bg:"card.bgDark",position:"fixed",children:(0,x.jsx)(o.Translation,{component:c.zx,translation:["common.start","common.deposit"],variant:"ctaFull",onClick:function(){return v(!0)}})})]})}},98365:function(t,e,n){n.r(e),n.d(e,{Withdraw:function(){return A}});var s=n(74165),a=n(15861),i=n(29439),r=n(5128),o=n(54447),l=n(99594),c=n(88935),d=n(61617),u=n(15542),x=n(1128),m=n(85267),p=n(1669),g=n(43127),f=n(3498),h=n(7276),v=n(23023),j=n(4710),w=n(78951),y=n(66624),b=n(86393),S=n(75712),C=n(45263),A=function(t){var e=t.itemIndex,n=(0,h.useState)("0"),A=(0,i.Z)(n,2),I=A[0],T=A[1],M=(0,h.useState)(""),k=(0,i.Z)(M,2),Z=k[0],P=k[1],D=(0,h.useState)(0),E=(0,i.Z)(D,2),U=E[0],z=E[1],B=(0,h.useState)(null),G=(0,i.Z)(B,2),F=G[0],_=G[1],L=(0,c.Y)().account,W=(0,m.m)().searchParams,O=(0,j.useOperativeComponent)(),R=O.dispatch,H=O.activeItem,V=O.activeStep,N=(0,S.useAssetProvider)(),q=N.asset,K=N.vault,X=N.underlyingAsset,Q=N.translate,Y=(0,v.R)(),$=Y.sendTransaction,J=Y.setGasLimit,tt=Y.state.transaction,et=(0,p.w)().selectors,nt=et.selectAssetPriceUsd,st=et.selectVaultPrice,at=et.selectAssetBalance,it=et.selectVaultGauge,rt=et.selectAssetById,ot=(0,h.useMemo)((function(){return W}),[W]),lt=(0,i.Z)(ot,2)[1],ct=(0,h.useMemo)((function(){return at?at(null===K||void 0===K?void 0:K.id):(0,l.gA)(0)}),[at,null===K||void 0===K?void 0:K.id]),dt=(0,h.useMemo)((function(){return(null===q||void 0===q?void 0:q.id)&&it&&it(q.id)}),[it,null===q||void 0===q?void 0:q.id]),ut=(0,h.useMemo)((function(){return dt&&rt&&rt(dt.id)}),[rt,dt]),xt=(0,h.useMemo)((function(){if(!at)return(0,l.gA)(0);var t=at(null===K||void 0===K?void 0:K.id),e=st(null===K||void 0===K?void 0:K.id);return t.times(e)}),[at,st,null===K||void 0===K?void 0:K.id]),mt=(0,h.useMemo)((function(){return P(""),!(!(0,l.gA)(I).isNaN()&&!(0,l.gA)(I).lte(0))||!!(0,l.gA)(I).gt(xt)&&(P(Q("trade.errors.insufficientFundsForAmount",{symbol:null===X||void 0===X?void 0:X.name})),!0)}),[I,xt,X,Q]),pt=(0,h.useCallback)((function(){L&&!mt&&K&&"getWithdrawContractSendMethod"in K&&"getWithdrawParams"in K&&(0,a.Z)((0,s.Z)().mark((function t(){var e,n,a,i;return(0,s.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=st(K.id),n=r.Z.minimum(ct,(0,l.gA)(I).div(e)),a=K.getWithdrawParams(n),i=K.getWithdrawContractSendMethod(a),$(K.id,K.id,i);case 5:case"end":return t.stop()}}),t)})))()}),[L,mt,I,K,ct,st,$]);(0,h.useEffect)((function(){V===e&&"success"===tt.status&&T("")}),[tt.status,V,e]),(0,h.useEffect)((function(){if(nt&&st&&X&&K){var t=nt(X.id),e=parseFloat((0,l.gA)(I).times(t).toString())||0;z(e)}}),[X,K,I,st,nt,R]);var gt=(0,h.useCallback)((function(){xt&&T(xt.toString())}),[xt]),ft=(0,h.useCallback)((0,a.Z)((0,s.Z)().mark((function t(){var e,n,a,i,r;return(0,s.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(K&&"getWithdrawContractSendMethod"in K&&"getWithdrawParams"in K){t.next=2;break}return t.abrupt("return");case 2:if(e=K.getMethodDefaultGasLimit("withdraw"),L&&!ct.lte(0)){t.next=5;break}return t.abrupt("return",e);case 5:return n={from:null===L||void 0===L?void 0:L.address},a=K.getWithdrawParams(ct.toFixed()),i=K.getWithdrawContractSendMethod(a),t.next=10,(0,l.$K)(i,n);case 10:if(t.t0=t.sent,t.t0){t.next=13;break}t.t0=e;case 13:return r=t.t0,t.abrupt("return",r);case 15:case"end":return t.stop()}}),t)}))),[L,ct,K]);(0,h.useEffect)((function(){H===e&&(0,a.Z)((0,s.Z)().mark((function t(){var e;return(0,s.Z)().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,ft();case 3:e=t.sent,J(e),t.next=10;break;case 7:t.prev=7,t.t0=t.catch(0),_(t.t0.message.toString().split("\n")[0]);case 10:case"end":return t.stop()}}),t,null,[[0,7]])})))()}),[H,e,ft,J,_]),(0,h.useEffect)((function(){H===e&&(R({type:"SET_ASSET",payload:q}),st&&K&&(R({type:"SET_AMOUNT",payload:(0,l.gA)(I).toString()}),R({type:"SET_DEFAULT_AMOUNT",payload:(0,l.gA)(I).toString()})))}),[K,q,I,st,H,e,R,pt]);var ht=(0,h.useMemo)((function(){return L?(0,C.jsx)(u.Translation,{component:g.zx,translation:"common.withdraw",disabled:mt,onClick:pt,variant:"ctaFull"}):(0,C.jsx)(b.ConnectWalletButton,{variant:"ctaFull"})}),[L,mt,pt]),vt=(0,h.useMemo)((function(){return K&&"messages"in K?K.messages:void 0}),[K]);return(0,C.jsx)(S.AssetProvider,{flex:1,width:"100%",assetId:null===q||void 0===q?void 0:q.id,children:(0,C.jsxs)(f.gC,{pt:8,flex:1,spacing:6,width:"100%",height:"100%",id:"withdraw-container",alignItems:"space-between",justifyContent:"flex-start",children:[(0,C.jsxs)(f.gC,{flex:1,spacing:6,width:"100%",alignItems:"flex-start",children:[(0,C.jsxs)(f.Ug,{width:"100%",spacing:[3,4],alignItems:"flex-start",children:[(0,C.jsx)(f.xu,{pt:8,children:(0,C.jsx)(d.AssetLabel,{assetId:null===q||void 0===q?void 0:q.id})}),(0,C.jsxs)(f.gC,{spacing:1,width:"100%",alignItems:"flex-start",children:[(0,C.jsx)(o.Card,{px:4,py:2,layerStyle:"cardLight",children:(0,C.jsxs)(f.gC,{spacing:2,alignItems:"flex-start",children:[(0,C.jsx)(x.InputAmount,{amount:I,amountUsd:U,setAmount:T}),(0,C.jsxs)(f.Ug,{width:"100%",justifyContent:"space-between",children:[(0,C.jsxs)(f.Ug,{spacing:1,children:[(0,C.jsx)(u.Translation,{component:f.xv,translation:"common.balance",textStyle:"captionSmaller"}),(0,C.jsx)(S.AssetProvider.VaultBalance,{abbreviate:!0,decimals:4,textStyle:"captionSmaller",color:"primary"})]}),(0,C.jsx)(g.zx,{variant:"selector",onClick:gt,children:"MAX"})]})]})}),Z&&(0,C.jsx)(f.xv,{textStyle:"captionSmaller",color:"orange",children:Z})]})]}),F?(0,C.jsx)(o.Card.Dark,{p:2,border:0,children:(0,C.jsx)(u.Translation,{textStyle:"captionSmaller",translation:"trade.actions.withdraw.messages.gasEstimateError",params:{supportLink:'<a href="https://discord.com/channels/606071749657755668/606073687799627776">Discord channel</a>',error:F},isHtml:!0,textAlign:"center"})}):xt.gt(0)&&null!==vt&&void 0!==vt&&vt.withdraw?(0,C.jsx)(o.Card.Dark,{p:2,border:0,children:(0,C.jsx)(u.Translation,{textStyle:"captionSmaller",translation:vt.withdraw,textAlign:"center"})}):(0,l.gA)(null===ut||void 0===ut?void 0:ut.balance).gt(0)&&(0,C.jsx)(o.Card.Dark,{py:2,pl:3,pr:2,border:0,children:(0,C.jsxs)(f.Ug,{spacing:3,width:"full",children:[(0,C.jsx)(u.Translation,{textStyle:"captionSmaller",translation:"trade.actions.withdraw.messages.unstakeFromGauge",textAlign:"left"}),(0,C.jsx)(u.Translation,{component:g.zx,translation:"common.unstake",fontSize:"xs",height:"auto",width:"auto",py:3,px:7,onClick:function(){return lt("?tab=gauge")}})]})}),(0,C.jsx)(y.DynamicActionFields,{assetId:null===q||void 0===q?void 0:q.id,action:"withdraw",amount:I,amountUsd:U})]}),(0,C.jsxs)(f.gC,{spacing:4,id:"footer",alignItems:"flex-start",children:[(0,C.jsx)(w.EstimatedGasFees,{}),ht]})]})})}},60110:function(t,e,n){n.r(e),n.d(e,{StrategyLabel:function(){return d}});var s=n(1413),a=n(45987),i=(n(7276),n(12056)),r=n(15542),o=n(3498),l=n(45263),c=["strategy","customText","showLabel"],d=function(t){var e=t.strategy,n=t.customText,d=t.showLabel,u=void 0===d||d,x=(0,a.Z)(t,c);if(!e)return null;var m=i.A[e];return m?(0,l.jsxs)(o.Ug,{spacing:2,alignItems:"center",children:[u&&(0,l.jsx)(r.Translation,(0,s.Z)({component:o.xv,translation:n||(null===m||void 0===m?void 0:m.label),textStyle:"ctaStatic"},x)),(0,l.jsx)(o.xu,{width:2,height:2,borderRadius:"50%",bg:m.color})]}):null}}}]);