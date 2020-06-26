import { SHA256 } from 'meteor/sha';
import React, { useMemo, useState, useCallback } from 'react';
import { ButtonGroup, Button, Box, Icon, PasswordInput } from '@rocket.chat/fuselage';

import Page from '../components/basic/Page';
import AccountProfileForm from './AccountProfileForm';
import { useTranslation } from '../contexts/TranslationContext';
import { useForm } from '../hooks/useForm';
import { useSetting } from '../contexts/SettingsContext';
import { useUser } from '../contexts/UserContext';
import { useMethod } from '../contexts/ServerContext';
import { Modal } from '../components/basic/Modal';
import { useUpdateAvatar } from '../hooks/useUpdateAvatar';

const getUserEmailAddress = (user) => user.emails && user.emails[0] && user.emails[0].address;

const PasswordConfirmModal = ({ onSave, onCancel, ...props }) => {
	const t = useTranslation();
	const [typedPassword, setTypedPassword] = useState('');

	const handleChange = useCallback((e) => setTypedPassword(e.currentTarget.value), [setTypedPassword]);
	const handleSave = useCallback(() => { onSave(typedPassword); onCancel(); }, [typedPassword, onSave, onCancel]);

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Please_enter_your_password')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('For_your_security_you_must_enter_your_current_password_to_continue')}
			<PasswordInput value={typedPassword} onChange={handleChange}/>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={handleSave}>{t('Continue')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const getInitialValues = (user) => ({
	realname: user.name ?? '',
	email: getUserEmailAddress(user) ?? '',
	username: user.username ?? '',
	password: '',
	confirmationPassword: '',
	avatar: '',
	url: user.avatarUrl ?? '',
	statusText: user.statusText ?? '',
	statusType: user.status ?? '',
	bio: user.bio ?? '',
});

const AccountProfilePage = (props) => {
	const t = useTranslation();

	const user = useUser();

	const { values, handlers, hasUnsavedChanges } = useForm(getInitialValues(user));
	const [canSave, setCanSave] = useState(true);
	const [modal, setModal] = useState(null);

	const saveFn = useMethod('saveUserProfile');

	const closeModal = useCallback(() => setModal(null), [setModal]);

	console.log({
		user,
		values,
		handlers,
		hasUnsavedChanges,
	});

	const requirePasswordConfirmation = (values.email !== getUserEmailAddress(user) || !!values.password) && (user && user.services && user.services.password && user.services.password.bcrypt);

	const allowRealNameChange = useSetting('Accounts_AllowRealNameChange');
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const allowUsernameChange = useSetting('Accounts_AllowUsernameChange');
	const allowEmailChange = useSetting('Accounts_AllowEmailChange');
	const allowPasswordChange = useSetting('Accounts_AllowPasswordChange');
	const allowUserAvatarChange = useSetting('Accounts_AllowUserAvatarChange');
	const allowDeleteOwnAccount = useSetting('Accounts_AllowDeleteOwnAccount');
	const ldapEnabled = useSetting('LDAP_Enable');
	const requireName = useSetting('Accounts_RequireNameForSignUp');
	const namesRegexSetting = useSetting('UTF8_Names_Validation');

	const namesRegex = useMemo(() => new RegExp(`^${ namesRegexSetting }$`), [namesRegexSetting]);

	const canChangeUsername = allowUsernameChange && !ldapEnabled;

	const settings = useMemo(() => ({
		allowRealNameChange,
		allowUserStatusMessageChange,
		allowEmailChange,
		allowPasswordChange,
		allowUserAvatarChange,
		allowDeleteOwnAccount,
		canChangeUsername,
		requireName,
		namesRegex,
	}), [
		allowDeleteOwnAccount,
		allowEmailChange,
		allowPasswordChange,
		allowRealNameChange,
		allowUserAvatarChange,
		allowUserStatusMessageChange,
		canChangeUsername,
		requireName,
		namesRegex,
	]);

	const {
		realname,
		email,
		avatar,
		username,
		password,
		statusText,
		bio,
	} = values;

	const { handleAvatar } = handlers;

	const updateAvatar = useUpdateAvatar(avatar, user._id);

	const onSave = useCallback(async () => {
		const save = async (typedPassword) => {
			try {
				const avatarResult = await updateAvatar();
				if (avatarResult) { handleAvatar(''); }
				const result = await saveFn({
					...allowRealNameChange && { realname },
					...allowEmailChange && user.email !== email && { email },
					...allowPasswordChange && { password },
					...canChangeUsername && { username },
					...allowUserStatusMessageChange && { statusText },
					...typedPassword && { typedPassword: SHA256(typedPassword) },
					bio,
				});
				console.log({ result });
			} catch (e) {
				console.log(e);
			}
		};

		if (requirePasswordConfirmation) {
			return setModal(() => <PasswordConfirmModal onSave={save} onCancel={closeModal}/>);
		}

		save();
	}, [
		saveFn,
		allowEmailChange,
		allowPasswordChange,
		allowRealNameChange,
		allowUserStatusMessageChange,
		bio,
		canChangeUsername,
		email,
		password,
		realname,
		statusText,
		username,
		user.email,
		updateAvatar,
		handleAvatar,
		closeModal,
		requirePasswordConfirmation,
	]);

	return <>
		<Page {...props}>
			<Page.Header title={t('Profile')}>
				<ButtonGroup>
					<Button primary disabled={!hasUnsavedChanges || !canSave} onClick={onSave}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<AccountProfileForm values={values} handlers={handlers} user={user} settings={settings} setCanSave={setCanSave}/>
				</Box>
			</Page.ScrollableContent>
		</Page>
		{ modal }
	</>;
};

export default AccountProfilePage;
