import axios from 'axios';
import authService from '../api-authorization/AuthorizeService';
import queryString from 'qs';

const appClient = axios.create({
    baseURL: `${document.getElementsByTagName('base')[0].getAttribute('href')}api`,
    paramsSerializer: params => {
        return queryString.stringify(params)
    }
});

// source: https://auralinna.blog/post/2019/global-http-request-and-response-handling-with-the-axios-interceptor/
const isHandlerEnabled = (config = {}) => {
    return config.hasOwnProperty('handlerEnabled') && !config.handlerEnabled ?
        false : true;
};

appClient.interceptors.request.use(
    async request => {

        const accessToken = await authService.getAccessToken();
        request.headers = {
            ...request.headers,
            ...(!accessToken ? {} : { 'Authorization': `Bearer ${accessToken}` })
        };

        if (isHandlerEnabled(request)) {
            // Modify request here.
        }

        return request;
    }
);

appClient.interceptors.response.use(
    response => {
        if (isHandlerEnabled(response.config)) {
            // Handle responses here.
        }
        return response;
    },
    error => {
        if (isHandlerEnabled(error.config)) {
            // Handle errors here.

        }

        return Promise.reject({ ...error });
    }
);

export default appClient;