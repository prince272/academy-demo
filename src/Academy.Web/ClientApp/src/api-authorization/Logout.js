﻿import React from 'react'
import { Component } from 'react';
import authService from './AuthorizeService';
import { AuthenticationResultStatus } from './AuthorizeService';
import { QueryParameterNames, LogoutActions, ApplicationPaths } from './ApiAuthorizationConstants';
import AppLoader from '../components/shared/AppLoader';
import { Redirect } from 'react-router-dom';

// The main responsibility of this component is to handle the user's logout process.
// This is the starting point for the logout process, which is usually initiated when a
// user clicks on the logout button on the LoginMenu component.
export class Logout extends Component {
    constructor(props) {
        super(props);

        this.state = {
            message: undefined,
            isReady: false,
            authenticated: false
        };
    }

    componentDidMount() {
        const action = this.props.action;
        switch (action) {
            case LogoutActions.Logout:
                //if (!!window.history.state.state.local) {
               
                //} else {
                //    // This prevents regular links to <app>/authentication/logout from triggering a logout
                //    this.setState({ isReady: true, message: "The logout was not initiated from within the page." });
                //}

                this.logout(this.getReturnUrl());
                break;
            case LogoutActions.LogoutCallback:
                this.processLogoutCallback();
                break;
            case LogoutActions.LoggedOut:
                this.setState({ isReady: true, message: "You successfully logged out!" });
                break;
            default:
                throw new Error(`Invalid action '${action}'`);
        }

        this.populateAuthenticationState();
    }

    render() {
        const { isReady, message } = this.state;
        if (!isReady) {
            //return <div></div>
            return (<AppLoader />);
        }
        const action = this.props.action;
        switch (action) {
            case LogoutActions.Logout:
                // return (<div>Processing logout</div>);
                return (<AppLoader />);
            case LogoutActions.LogoutCallback:
                // return (<div>Processing logout callback</div>);
                return (<AppLoader />);
            case LogoutActions.LoggedOut:
                //return (<div>{message}</div>);
                return <Redirect to={'/'} />;
            default:
                throw new Error(`Invalid action '${action}'`);
        }
    }

    async logout(returnUrl) {
        const state = { returnUrl };
        const isauthenticated = await authService.isAuthenticated();
        if (isauthenticated) {
            const result = await authService.signOut(state);
            switch (result.status) {
                case AuthenticationResultStatus.Redirect:
                    break;
                case AuthenticationResultStatus.Success:
                    await this.navigateToReturnUrl(returnUrl);
                    break;
                case AuthenticationResultStatus.Fail:
                    this.setState({ message: result.message });
                    break;
                default:
                    throw new Error("Invalid authentication result status.");
            }
        } else {
            this.setState({ message: "You successfully logged out!" });
        }
    }

    async processLogoutCallback() {
        const url = window.location.href;
        const result = await authService.completeSignOut(url);
        switch (result.status) {
            case AuthenticationResultStatus.Redirect:
                // There should not be any redirects as the only time completeAuthentication finishes
                // is when we are doing a redirect sign in flow.
                throw new Error('Should not redirect.');
            case AuthenticationResultStatus.Success:
                await this.navigateToReturnUrl(this.getReturnUrl(result.state));
                break;
            case AuthenticationResultStatus.Fail:
                this.setState({ message: result.message });
                break;
            default:
                throw new Error("Invalid authentication result status.");
        }
    }

    async populateAuthenticationState() {
        const authenticated = await authService.isAuthenticated();
        this.setState({ isReady: true, authenticated });
    }

    getReturnUrl(state) {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get(QueryParameterNames.ReturnUrl);
        if (fromQuery && !fromQuery.startsWith(`${window.location.origin}/`)) {
            // This is an extra check to prevent open redirects.
            throw new Error("Invalid return url. The return url needs to have the same origin as the current page.")
        }
        return (state && state.returnUrl) ||
            fromQuery ||
            `${window.location.origin}${ApplicationPaths.LoggedOut}`;
    }

    navigateToReturnUrl(returnUrl) {
        return window.location.replace(returnUrl);
    }
}
