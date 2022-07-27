import React from 'react';
import { Toaster } from 'react-hot-toast';

const AppToastor = () => {
    return <Toaster position="top-center" reverseOrder={true} toastOptions={{
        // Define default options
        className: 'theme-bg-dark theme-text-white',
    }} />;
};

export default AppToastor;