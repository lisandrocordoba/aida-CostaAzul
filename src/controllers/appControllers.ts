import fs from 'fs';
import { Request, Response, /*NextFunction*/ } from "express";

export function loginController(req: Request , res: Response) {
    if (req.session.usuario) {
        return res.redirect('/app/menu');
    }
    const loginHtml = fs.readFileSync('views/login.html', 'utf8');
    res.send(loginHtml);
  }
