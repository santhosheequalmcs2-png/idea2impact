import jwt from 'jsonwebtoken';
export function requireAuth(req,res,next){const token=req.cookies?.session||req.headers.authorization?.replace(/^Bearer /,'');if(!token)return res.status(401).json({error:'Authentication required'});try{req.user=jwt.verify(token,process.env.JWT_SECRET);next()}catch{return res.status(401).json({error:'Session expired'})}}
export const requireRole=(...roles)=>(req,res,next)=>{if(!req.user?.roles?.some(r=>roles.includes(r)))return res.status(403).json({error:'Insufficient permissions'});next()};
