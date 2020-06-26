import React, { useEffect } from 'react';

import { useRouteParameter, useCurrentRoute } from '../contexts/RouterContext';
import { SideNav } from '../../app/ui-utils';
import AccountProfilePage from './AccountProfilePage';
import { createAccountSidebarTemplate } from './sidebarItems';

createAccountSidebarTemplate();

const AccountRoute = (props) => {
	// const page = useRouteParameter('group')
	const currentRoute = useCurrentRoute();
	console.log(currentRoute);
	const page = useRouteParameter('group');

	useEffect(() => {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});

	return <>
		{{
			profile: <AccountProfilePage />,
		}[page]}
	</>;
};

export default AccountRoute;
