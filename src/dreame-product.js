// Dreame Singapore's X60 specification cards, retrieved 21 November 2026.
// Dock dimensions are W × D × H; the separate entry ramp is estimated.
const shared={
  url:'https://dreame.sg/products/dreame-x60-ultra-master',
  robotWidth:.350,robotDepth:.350,robotHeight:.0795,robotRaisedHeight:.1028,
  rampDepth:.12,rearGap:.02,
};
export const DREAME_X60_MODELS=Object.freeze({
  'dreame-x60-ultra':Object.freeze({...shared,id:'dreame-x60-ultra',label:'Dreame X60 Ultra',
    width:.390,depth:.423,height:.499,
    image:'./references/inspiration/dreame-x60-ultra.png',
    specification:'./references/inspiration/dreame-x60-ultra-spec.png'}),
  'dreame-x60-master':Object.freeze({...shared,id:'dreame-x60-master',label:'Dreame X60 Master',
    width:.416,depth:.443,height:.249,
    image:'./references/inspiration/dreame-x60-master.png',
    specification:'./references/inspiration/dreame-x60-master-spec.png'}),
});
export const getDreameProduct=id=>DREAME_X60_MODELS[id]??null;
export const DB_VACUUM_OPENING=Object.freeze({height:.732,panelThickness:.018});
