"use strict";(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[585,9177,1617,4447,6634,1925],{39177:function(e,t,r){r.r(t),r.d(t,{AddressLink:function(){return d}});var n=r(1413),i=r(45987),a=r(7276),o=r(3498),s=r(99594),c=r(88935),u=r(45263),l=["address","text"],d=function(e){var t=e.address,r=e.text,d=(0,i.Z)(e,l),f=(0,c.Y)(),h=f.chainId,v=f.explorer,m=(0,a.useMemo)((function(){return(0,s.SV)(h,v,t)}),[h,v,t]);return(0,u.jsx)(o.rU,(0,n.Z)((0,n.Z)({href:m,textStyle:"tableCell",color:"link",isExternal:!0},d),{},{children:r||(0,s.pc)(t)}))}},61617:function(e,t,r){r.r(t),r.d(t,{AssetLabel:function(){return u}});var n=r(1413),i=r(45987),a=r(3498),o=r(75712),s=r(45263),c=["assetId","size","spacing"],u=function(e){var t=e.assetId,r=e.size,u=void 0===r?"sm":r,l=e.spacing,d=(0,i.Z)(e,c);return(0,s.jsx)(o.AssetProvider,{wrapFlex:!1,assetId:t,children:(0,s.jsxs)(a.Ug,{spacing:l,alignItems:"center",justifyContent:"flex-start",children:[(0,s.jsx)(o.AssetProvider.Icon,{size:u}),(0,s.jsx)(o.AssetProvider.Name,(0,n.Z)({textStyle:"heading",fontSize:["15px","h3"],whiteSpace:"nowrap"},d))]})})}},54447:function(e,t,r){r.r(t),r.d(t,{Card:function(){return h},CardFlex:function(){return v},Dark:function(){return m},Light:function(){return x},Outline:function(){return p}});var n=r(1413),i=r(45987),a=r(3498),o=r(45263),s=["children"],c=["children","layerStyle"],u=["children","layerStyle"],l=["children"],d=["children"],f=["children"],h=function(e){var t=e.children,r=e.layerStyle,s=(0,i.Z)(e,c);return(0,o.jsx)(a.xu,(0,n.Z)((0,n.Z)({width:"100%",position:"relative",layerStyle:r||"card"},s),{},{children:t}))},v=function(e){var t=e.children,r=e.layerStyle,s=(0,i.Z)(e,u);return(0,o.jsx)(a.kC,(0,n.Z)((0,n.Z)({width:"100%",layerStyle:r||"card"},s),{},{children:t}))},m=function(e){var t=e.children,r=(0,i.Z)(e,l),a=["cardDark"].concat(e.layerStyle);return(0,o.jsx)(h,(0,n.Z)((0,n.Z)({},r),{},{layerStyle:a,children:t}))},x=function(e){var t=e.children,r=(0,i.Z)(e,d),a=["cardLight"].concat(e.layerStyle);return(0,o.jsx)(h,(0,n.Z)((0,n.Z)({},r),{},{layerStyle:a,children:t}))},p=function(e){var t=e.children,r=(0,i.Z)(e,f),a=["cardOutline"].concat(e.layerStyle);return(0,o.jsx)(h,(0,n.Z)((0,n.Z)({},r),{},{layerStyle:a,children:t}))};h.Dark=m,h.Light=x,h.Flex=v,h.Outline=p,h.Heading=function(e){var t=e.children,r=(0,i.Z)(e,s);return(0,o.jsx)(a.X6,(0,n.Z)((0,n.Z)({as:"h3",size:"md",mb:6},r),{},{children:t}))}},6634:function(e,t,r){r.r(t),r.d(t,{GenericChart:function(){return c}});var n=r(7276),i=r(3498),a=r(99594),o=r(45327),s=r(45263),c=function(e){var t=e.data,r=e.assetIds,c=e.isRainbowChart,u=e.height,l=void 0===u?"350px":u,d=e.maxMinEnabled,f=void 0===d||d,h=e.color,v=void 0===h?"chart.stroke":h,m=e.formatFn,x=void 0===m?function(e){return"$".concat((0,a.dm)(e))}:m,p=e.margins,y=void 0===p?{top:0,right:0,bottom:0,left:0}:p,g=(0,n.useMemo)((function(){return t||{total:[],rainbow:[]}}),[t]),w=(0,n.useMemo)((function(){return!g.rainbow.length}),[g]);return(0,s.jsx)(i.xu,{width:"full",p:0,height:l,children:(0,s.jsx)(o.Graph,{color:v,data:g,loading:w,margins:y,assetIds:r,isLoaded:!w,formatFn:x,maxMinEnabled:f,isRainbowChart:c})})}},61925:function(e,t,r){r.r(t),r.d(t,{TimeframeSelector:function(){return l}});var n=r(1413),i=r(45987),a=(r(7276),r(98440)),o=r(3498),s=r(43127),c=r(45263),u=["timeframe","setTimeframe","variant"],l=function(e){var t=e.timeframe,r=e.setTimeframe,l=e.variant,d=void 0===l?"text":l,f=(0,i.Z)(e,u);return(0,c.jsx)(o.Ug,(0,n.Z)((0,n.Z)({spacing:"button"===d?4:[6,10]},f),{},{children:Object.values(a.W).map((function(e){var n=e===t;switch(d){default:case"text":return(0,c.jsx)(o.xv,{textStyle:"cta",color:"ctaDisabled","aria-selected":n,onClick:function(){return r(e)},children:e.toUpperCase()},"timeframe_".concat(e));case"button":return(0,c.jsx)(s.zx,{px:3,border:0,textStyle:"cta",variant:"filter","aria-selected":n,onClick:function(){return r(e)},children:e.toUpperCase()},"timeframe_".concat(e))}}))}))}},53293:function(e,t,r){r.d(t,{Z:function(){return l}});var n=r(74165),i=r(15861),a=r(29439),o=r(7276),s=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,t=arguments.length>1?arguments[1]:void 0,r=null;return function(){r&&clearTimeout(r);for(var n=arguments.length,i=new Array(n),a=0;a<n;a++)i[a]=arguments[a];r=setTimeout(t,e,i)}},c={x:0,y:0,top:0,left:0,width:0,height:0,right:0,bottom:0};function u(e){var t=e.getBoundingClientRect();return{x:t.x,y:t.y,top:t.top,left:t.left,width:t.width,height:t.height,right:t.right,bottom:t.bottom}}function l(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,t=(0,o.useState)(null),r=(0,a.Z)(t,2),l=r[0],d=r[1],f=(0,o.useState)(c),h=(0,a.Z)(f,2),v=h[0],m=h[1],x=(0,o.useCallback)((function(e){d(e)}),[]);return(0,o.useLayoutEffect)((function(){if("undefined"!==typeof window&&l){var t=function(){var e=(0,i.Z)((0,n.Z)().mark((function e(){return(0,n.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:window.requestAnimationFrame((function(){m(u(l))}));case 1:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}();t();var r=s(e||100,t);return window.addEventListener("resize",r),window.addEventListener("scroll",r),function(){window.removeEventListener("resize",r),window.removeEventListener("scroll",r)}}}),[l,e]),[x,v,l]}},68414:function(e,t,r){r.d(t,{C:function(){return c}});var n=r(29439),i=r(44888),a=r(7276),o=r(99594),s=r(1669),c=function(e){var t=(0,a.useState)(!0),r=(0,n.Z)(t,2),c=r[0],u=r[1],l=(0,s.w)(),d=l.historicalRates,f=l.historicalPrices,h=l.selectors,v=h.selectAssetsByIds,m=h.selectVaultById,x=h.selectAssetHistoricalPrices,p=h.selectAssetHistoricalRates,y=e.useRates,g=void 0!==y&&y,w=e.assetIds,Z=e.timeframe,b=(0,a.useMemo)((function(){return v?v(w):[]}),[w,v]),S=(0,a.useMemo)((function(){return Z?(0,o.pM)(Z):0}),[Z]),j=(0,a.useMemo)((function(){var e={total:[],rainbow:[]};if(g){if(!Object.keys(d).length)return e;var t=b.reduce((function(t,r,n){if(!r.id)return t;var a=p(r.id);if(!a)return t;var s=m(r.id),c=(0,o.gA)(1),u=null;return a.forEach((function(a){var l,d=a.date,f=a.value,h="stats"in s&&(null===(l=s.stats)||void 0===l?void 0:l.startTimestamp);if(!(d<(h&&h>S?h:S))){if(u&&(0,o.gA)(f).lt(9999)){var v=Math.round((d-u.date)/1e3),m=(0,o.gA)(f).div(100).times(v).div(i.eG);c=c.plus(c.times(m))}var x=c.toNumber();t[d]||(t[d]={date:d,total:0}),r.id&&(t[d][r.id]=x,n||e.total.push({date:d,value:x})),u=a}})),t}),{});e.rainbow=Object.values(t)}else{if(!Object.keys(f).length)return e;var r=b.reduce((function(t,r,n){if(!r.id)return t;var i=x(r.id);if(!i)return t;var a=m(r.id);return i.forEach((function(i){var o,s=i.date,c="stats"in a&&(null===(o=a.stats)||void 0===o?void 0:o.startTimestamp);if(!(s<(c&&c>S?c:S))){var u=i.value;t[s]||(t[s]={date:s,total:0}),r.id&&(t[s][r.id]=u,n||e.total.push({date:s,value:u}))}})),t}),{});e.rainbow=Object.values(r)}return e}),[b,f,x,p,d,g,m,S]);return(0,a.useEffect)((function(){if(j.rainbow.length)return u(!1),function(){u(!0)}}),[j]),{assets:b,performanceChartData:j,performanceChartDataLoading:c}}}}]);