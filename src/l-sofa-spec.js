export const L_SOFA=Object.freeze({
  type:'l-sofa',label:'L-shaped sofa',width:2.4,depth:1.55,height:.88,
  mainDepth:.9,chaiseWidth:.82,color:'#747674',
});

// Faces local +Z, with the chaise at the local +X end. The open corner is
// usable floor, so collision checks use these two rectangles, not the envelope.
export function lSofaFootprintRects(width=L_SOFA.width,depth=L_SOFA.depth){
  const mainDepth=depth*L_SOFA.mainDepth/L_SOFA.depth;
  const chaiseWidth=width*L_SOFA.chaiseWidth/L_SOFA.width;
  return [
    {x:0,z:(mainDepth-depth)/2,width,depth:mainDepth},
    {x:(width-chaiseWidth)/2,z:mainDepth/2,width:chaiseWidth,depth:depth-mainDepth},
  ];
}
