import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { parseCookies, REFRESH_COOKIE_NAME, refreshCookieOptions } from '../utils/cookies.js';

function requestContext(req) {
    return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

function setRefreshCookie(res, refresh) {
    res.cookie(REFRESH_COOKIE_NAME, refresh.rawToken, refreshCookieOptions(refresh.maxAgeMs));
}

function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body, requestContext(req));
    ok(res, { data: user, message: 'Registro exitoso. Ya puedes iniciar sesión.' }, 201);
});

export const login = asyncHandler(async (req, res) => {
    const { email, password, remember } = req.body;
    const { user, accessToken, refresh } = await authService.login(email, password, remember, requestContext(req));

    setRefreshCookie(res, refresh);
    ok(res, { data: { user, accessToken }, message: 'Inicio de sesión exitoso.' });
});

export const refresh = asyncHandler(async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const { user, accessToken, refresh: newRefresh } = await authService.refresh(
        cookies[REFRESH_COOKIE_NAME],
        requestContext(req),
    );

    setRefreshCookie(res, newRefresh);
    ok(res, { data: { user, accessToken }, message: 'Sesión renovada.' });
});

export const logout = asyncHandler(async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    await authService.logout(cookies[REFRESH_COOKIE_NAME]);
    clearRefreshCookie(res);
    ok(res, { data: null, message: 'Sesión cerrada.' });
});

export const me = asyncHandler(async (req, res) => {
    const profile = await authService.me(req.user.id);
    ok(res, { data: profile });
});

export const updateMe = asyncHandler(async (req, res) => {
    const profile = await authService.updateProfile(req.user.id, req.body);
    ok(res, { data: profile, message: 'Perfil actualizado correctamente.' });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    ok(res, { data: null, message: 'Contraseña actualizada correctamente.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    ok(res, { data: { resetToken: result.resetToken }, message: result.message });
});

export const resetPassword = asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password);
    ok(res, { data: null, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
});

export default { register, login, refresh, logout, me, updateMe, changeMyPassword, forgotPassword, resetPassword };
