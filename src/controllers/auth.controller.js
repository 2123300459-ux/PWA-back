import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("Define la variable de entorno JWT_SECRET");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: "Todos los campos son obligatorios" });
    }

    const exist = await User.findOne({ email });
    if (exist) return res.status(409).json({ ok: false, message: "El usuario ya esta registrado" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash });
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ ok: false, message: "Error en el servidor", error: e.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contrasena son obligatorios" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Email o contrasena incorrecta" });
    if (!user.password) {
      return res.status(401).json({ message: "Esta cuenta usa inicio de sesion con Google" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Email o contrasena incorrecta" });

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: "Error en el servidor", error: e.message });
  }
}

export async function googleLogin(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Token de Google requerido" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID no esta configurado" });
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error("Google token verification failed:", error.message);
      return res.status(401).json({
        message: "Google no pudo validar este inicio de sesion. Revisa que GOOGLE_CLIENT_ID sea el mismo en frontend y backend.",
      });
    }

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!payload?.sub || !email || !payload.email_verified) {
      return res.status(401).json({ message: "No se pudo validar la cuenta de Google" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        googleId: payload.sub,
        picture: payload.picture,
        authProvider: "google",
      });
    } else {
      user.googleId = user.googleId || payload.sub;
      user.picture = payload.picture || user.picture;
      user.authProvider = user.authProvider === "local" ? "local" : "google";
      await user.save();
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture },
    });
  } catch (e) {
    console.error("Google login error:", e);
    res.status(500).json({ message: "Inicio de sesion con Google fallido", error: e.message });
  }
}
