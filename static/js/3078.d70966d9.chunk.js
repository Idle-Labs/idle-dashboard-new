"use strict";(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[3078],{3078:function(t,e,s){s.r(e),s.d(e,{StrategyAssetsCarousel:function(){return h}});var i=s(29439),n=s(54447),o=s(3498),r=s(13961),a=s(15542),l=s(1669),c=s(75712),d=s(7276),u=s(45263),h=function(t){var e,s=t.strategy,h=(0,d.useState)(0),x=(0,i.Z)(h,2),f=x[0],p=x[1],v=(0,d.useState)(0),j=(0,i.Z)(v,2),y=j[0],w=j[1],S=(0,l.w)(),g=S.isPortfolioLoaded,m=S.selectors.selectVaultsAssetsByType,b=(0,d.useMemo)((function(){return m?m(s):null}),[m,s]),A=(0,d.useCallback)((function(){return f===b.length-1?0:f+1}),[b,f]);return(0,d.useEffect)((function(){b&&g&&setTimeout((function(){w(0),p(A())}),4e3)}),[b,g,A]),(0,d.useEffect)((function(){b&&g&&setTimeout((function(){w(100)}),10)}),[b,g,f]),(0,u.jsxs)(n.Card.Light,{py:4,px:6,overflow:"hidden",position:"relative",width:["100%","400px"],children:[(0,u.jsx)(c.AssetProvider,{assetId:b&&(null===(e=b[f])||void 0===e?void 0:e.id),children:(0,u.jsxs)(o.Ug,{spacing:10,width:"100%",alignItems:"center",justifyContent:"space-between",children:[(0,u.jsx)(c.AssetProvider.Icon,{width:10,height:10}),(0,u.jsxs)(o.Ug,{children:[(0,u.jsx)(a.Translation,{component:o.xv,translation:"defi.tvl",textStyle:"captionSmall"}),(0,u.jsx)(c.AssetProvider.PoolUsd,{textStyle:["ctaStatic","h3"]})]}),(0,u.jsxs)(o.Ug,{children:[(0,u.jsx)(a.Translation,{component:o.xv,translation:"defi.apy",textStyle:"captionSmall"}),(0,u.jsx)(c.AssetProvider.Apy,{textStyle:["ctaStatic","h3"]})]})]})}),(0,u.jsx)(o.xu,{left:0,bottom:0,width:"100%",position:"absolute",children:(0,u.jsx)(r.Ex,{value:y,size:"xs",colorScheme:s,sx:{"& > div:first-child":{transitionDuration:y?"4s":"0s",transitionProperty:"width"}}})})]})}}}]);