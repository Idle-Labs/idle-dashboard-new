"use strict";(self.webpackChunkidle_dashboard_new=self.webpackChunkidle_dashboard_new||[]).push([[7972,9177,4447,6064],{39177:function(e,n,t){t.r(n),t.d(n,{AddressLink:function(){return u}});var r=t(1413),l=t(45987),i=t(7276),s=t(3498),a=t(99594),o=t(88935),c=t(45263),d=["address","text"],u=function(e){var n=e.address,t=e.text,u=(0,l.Z)(e,d),x=(0,o.Y)(),h=x.chainId,f=x.explorer,p=(0,i.useMemo)((function(){return(0,a.SV)(h,f,n)}),[h,f,n]);return(0,c.jsx)(s.rU,(0,r.Z)((0,r.Z)({href:p,textStyle:"tableCell",color:"link",isExternal:!0},u),{},{children:t||(0,a.pc)(n)}))}},54447:function(e,n,t){t.r(n),t.d(n,{Card:function(){return h},CardFlex:function(){return f},Dark:function(){return p},Light:function(){return g},Outline:function(){return y}});var r=t(1413),l=t(45987),i=t(3498),s=t(45263),a=["children"],o=["children","layerStyle"],c=["children","layerStyle"],d=["children"],u=["children"],x=["children"],h=function(e){var n=e.children,t=e.layerStyle,a=(0,l.Z)(e,o);return(0,s.jsx)(i.xu,(0,r.Z)((0,r.Z)({width:"100%",position:"relative",layerStyle:t||"card"},a),{},{children:n}))},f=function(e){var n=e.children,t=e.layerStyle,a=(0,l.Z)(e,c);return(0,s.jsx)(i.kC,(0,r.Z)((0,r.Z)({width:"100%",layerStyle:t||"card"},a),{},{children:n}))},p=function(e){var n=e.children,t=(0,l.Z)(e,d),i=["cardDark"].concat(e.layerStyle);return(0,s.jsx)(h,(0,r.Z)((0,r.Z)({},t),{},{layerStyle:i,children:n}))},g=function(e){var n=e.children,t=(0,l.Z)(e,u),i=["cardLight"].concat(e.layerStyle);return(0,s.jsx)(h,(0,r.Z)((0,r.Z)({},t),{},{layerStyle:i,children:n}))},y=function(e){var n=e.children,t=(0,l.Z)(e,x),i=["cardOutline"].concat(e.layerStyle);return(0,s.jsx)(h,(0,r.Z)((0,r.Z)({},t),{},{layerStyle:i,children:n}))};h.Dark=p,h.Light=g,h.Flex=f,h.Outline=y,h.Heading=function(e){var n=e.children,t=(0,l.Z)(e,a);return(0,s.jsx)(i.X6,(0,r.Z)((0,r.Z)({as:"h3",size:"md",mb:6},t),{},{children:n}))}},66064:function(e,n,t){t.r(n),t.d(n,{ProtocolLabel:function(){return h}});var r=t(1413),l=t(45987),i=t(43098),s=t(22130),a=t(70221),o=t(3498),c=t(45263),d=["protocolId"],u=["protocolId","size"],x=function(e){var n=e.protocolId,t=(0,l.Z)(e,d),o=(0,s.i)(n);return o&&o.icon?(0,c.jsx)(a.qE,(0,r.Z)({p:0,bg:"transparent",src:o.icon,icon:(0,c.jsx)(i.HZe,{size:24}),sx:{"> img":{objectFit:"contain"}}},t)):null},h=function(e){var n=e.protocolId,t=e.size,i=void 0===t?"sm":t,a=(0,l.Z)(e,u),d=(0,s.i)(n);return d?(0,c.jsxs)(o.Ug,{alignItems:"center",justifyContent:"flex-start",children:[(0,c.jsx)(x,{protocolId:n,size:i}),(0,c.jsx)(o.xv,(0,r.Z)((0,r.Z)({textStyle:"heading",fontSize:"h3",whiteSpace:"nowrap"},a),{},{children:d.label}))]}):null}},67972:function(e,n,t){t.r(n),t.d(n,{VaultUnderlyingProtocols:function(){return p}});var r=t(99594),l=t(7276),i=t(54447),s=t(86059),a=t(93429),o=t(39177),c=t(15542),d=t(1669),u=t(75712),x=t(66064),h=t(3498),f=t(45263),p=function(e){var n,t,p=e.assetId,g=(0,d.w)().selectors,y=g.selectAssetById,v=g.selectVaultById,j=(0,l.useMemo)((function(){return y&&y(p)}),[y,p]),m=(0,l.useMemo)((function(){return v&&v(p)}),[v,p]);return m&&m instanceof a.H&&"tokenConfig"in m&&null!==(n=m.tokenConfig)&&void 0!==n&&n.protocols.length?(0,f.jsxs)(h.gC,{spacing:6,alignItems:"flex-start",children:[(0,f.jsx)(c.Translation,{component:h.X6,as:"h3",size:"md",translation:"defi.underlyingProtocols"}),(0,f.jsx)(h.MI,{spacing:6,width:"100%",columns:[1,3],children:null===(t=m.tokenConfig)||void 0===t?void 0:t.protocols.map((function(e){var n,t,l=(0,r.gA)(null===(n=j.allocations)||void 0===n?void 0:n[e.name]).div(100),a=(0,r.gA)(null===j||void 0===j?void 0:j.tvlUsd).times(l),d=null===j||void 0===j||null===(t=j.protocolsAprs)||void 0===t?void 0:t[e.address.toLowerCase()];return(0,f.jsx)(u.AssetProvider,{wrapFlex:!1,assetId:e.address,children:(0,f.jsx)(i.Card,{p:6,children:(0,f.jsxs)(h.gC,{spacing:6,width:"100%",alignItems:"flex-start",children:[(0,f.jsxs)(h.Ug,{spacing:2,width:"full",justifyContent:"space-between",children:[(0,f.jsxs)(h.Ug,{spacing:2,children:[(0,f.jsx)(x.ProtocolLabel,{protocolId:e.name,size:"xs"}),(0,f.jsx)(u.AssetProvider.Strategy,{prefix:"(",suffix:")",color:"primary"})]}),(0,f.jsx)(u.AssetProvider.StrategyBadge,{width:6,height:6})]}),(0,f.jsxs)(h.Ug,{spacing:6,width:"full",justifyContent:"space-between",children:[(0,f.jsxs)(h.gC,{spacing:1,alignItems:"flex-start",children:[(0,f.jsx)(c.Translation,{component:h.xv,translation:"defi.poolAddress",textStyle:"captionSmall"}),(0,f.jsx)(o.AddressLink,{address:e.address})]}),(0,f.jsxs)(h.gC,{spacing:1,alignItems:"flex-start",children:[(0,f.jsx)(c.Translation,{component:h.xv,translation:"defi.apy",textStyle:"captionSmall"}),(0,f.jsx)(s.Amount.Percentage,{value:d,textStyle:"tableCell"})]}),(0,f.jsxs)(h.gC,{spacing:1,alignItems:"flex-start",children:[(0,f.jsx)(c.Translation,{component:h.xv,translation:"assets.assetDetails.generalData.allocation",textStyle:"captionSmall"}),(0,f.jsx)(s.Amount.Usd,{value:a,textStyle:"tableCell"})]})]})]})})},"protocol_".concat(e.name))}))})]}):null}}}]);