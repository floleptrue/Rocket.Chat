import { useMemo, useCallback } from 'react';

import { useMethod } from '../contexts/ServerContext';
import { useEndpointAction } from './useEndpointAction';
import { useTranslation } from '../contexts/TranslationContext';
import { useEndpointUpload } from './useEndpointUpload';

export const useUpdateAvatar = (avatarObj, userId) => {
	const t = useTranslation();
	const avatarUrl = avatarObj?.avatarUrl;

	const successText = t('Avatar_changed_successfully');
	const setAvatarFromService = useMethod('setAvatarFromService');

	const saveAvatarQuery = useMemo(() => ({
		userId,
		avatarUrl,
	}), [avatarUrl, userId]);

	const resetAvatarQuery = useMemo(() => ({
		userId,
	}), [userId]);

	const saveAvatarAction = useEndpointUpload('users.setAvatar', saveAvatarQuery, successText);
	const saveAvatarUrlAction = useEndpointAction('POST', 'users.setAvatar', saveAvatarQuery, successText);
	const resetAvatarAction = useEndpointAction('POST', 'users.resetAvatar', resetAvatarQuery, successText);

	console.log(resetAvatarQuery);
	const updateAvatar = useCallback(async () => {
		if (avatarObj === 'reset') {
			return resetAvatarAction();
		}
		if (avatarObj.avatarUrl) {
			return saveAvatarUrlAction();
		}
		if (avatarObj.service) {
			const { blob, contentType, service } = avatarObj;
			try {
				const result = setAvatarFromService(blob, contentType, service);
				console.log('service', result);
			} catch (e) {
				console.log('service', e);
			}
			return;
		}
		avatarObj.set('userId', userId);
		return saveAvatarAction(avatarObj);
	}, [avatarObj, resetAvatarAction, saveAvatarAction, saveAvatarUrlAction, setAvatarFromService, userId]);

	return updateAvatar;
};
