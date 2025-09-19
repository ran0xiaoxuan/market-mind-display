import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const RecoveryGuard = () => {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		try {
			const search = location.search || '';
			const hash = location.hash || '';
			const pathname = location.pathname || '';
			const searchParams = new URLSearchParams(search);
			const hashParams = new URLSearchParams(hash ? hash.substring(1) : '');
			const typeParam = searchParams.get('type') || hashParams.get('type');
			const hasTokenHash = searchParams.has('token_hash') || hashParams.has('token_hash');
			const hasAccessRecoveryTokens = (hashParams.has('access_token') || searchParams.has('access_token')) && (typeParam === 'recovery');
			const shouldNormalize = (typeParam === 'recovery') || hasTokenHash || hasAccessRecoveryTokens;
			const alreadyOnReset = pathname.startsWith('/auth/reset-password');
			if (shouldNormalize && !alreadyOnReset) {
				navigate(`/auth/reset-password${search}${hash}`, { replace: true });
			}
		} catch (_) {}
	}, [location, navigate]);

	return null;
}; 