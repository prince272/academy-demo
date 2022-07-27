import React, { forwardRef } from 'react';

import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

import { getErrorResult, generateUUID } from '../../utilities';
import appClient from '../../utilities/appClient';

import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

import toast from 'react-hot-toast';
import appService from '../../utilities/appService';


registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const AssetUploader = forwardRef((props, ref) => {
    const assetType = props.assetType;
    const assetExtension = props.assetExtension;
    const assetStyle = props.assetStyle;

    const componentId = generateUUID();
    let pond = null;
    const getReslovedFiles = async (files) => {
        const assets = await Promise.all(files.map(async (file) => {
            const asset = file.serverId != null ? (await appService.getAsset(file.serverId))?.data || null : null;
            return { ...asset, id: file.serverId };
        }));


        return assets;
    };

    return (
        <div>
            <FilePond
                allowImagePreview={true}
                allowImageExifOrientation={true}
                ref={obj => {

                    if (obj != null) {
                        pond = obj;
                        ref && ref(obj);
                    }
                }}
                server={{
                    url: appClient.defaults.baseURL + '/assets',
                    process: {
                        url: '/upload',
                        method: 'POST',
                        headers: (file) => {
                            return {
                                'Upload-Name': file.name,
                                'Upload-Size': file.size,
                                'X-Requested-With': 'XMLHttpRequest',
                                ...(!assetType ? {} : { 'Upload-Type': `${assetType}` }),
                                ...(!assetExtension ? {} : { 'Upload-Extension': `${assetExtension}` })
                            };
                        },
                        onload: (response) => {
                            const data = JSON.parse(response.responseText).data;
                            return data.id;
                        },
                        onerror: (responseText) => {
                            var errorResult = getErrorResult({ response: { data: JSON.parse(responseText) } });
                            toast.error(errorResult.message, { toastId: componentId });
                        }
                    },
                    patch: {
                        url: '/upload/',
                        method: 'PATCH',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onerror: (responseText) => {
                            var errorResult = getErrorResult({ response: { data: JSON.parse(responseText) } });
                            toast.error(errorResult.message, { toastId: componentId });
                        }
                    },
                    revert: {
                        url: '/delete',
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onerror: (responseText) => {
                            var errorResult = getErrorResult({ response: { data: JSON.parse(responseText) } });
                            toast.error(errorResult.message, { toastId: componentId });
                        }
                    },
                    load: {
                        url: '/load/',
                        method: 'GET',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onerror: (response) => {
                            var errorResult = getErrorResult(response);
                            toast.error(errorResult.message, { toastId: componentId });
                        },
                    }
                }}
                chunkUploads={true}
                chunkForce={true}
                oninit={() => { props.onInitialize && props.onInitialize(pond); }}
                onremovefile={async () => {
                    const files = await getReslovedFiles(pond.getFiles());
                    if (props.onChange)
                        props.onChange(files);
                }}
                onprocessfiles={async () => {
                    const files = await getReslovedFiles(pond.getFiles());
                    if (props.onChange)
                        props.onChange(files);
                }}
                {...(assetStyle == 'circle' ? {
                    imageCropAspectRatio: '1:1',
                    stylePanelLayout: 'compact circle',
                    styleLoadIndicatorPosition: 'center bottom',
                    styleProgressIndicatorPosition: 'right bottom',
                    styleButtonRemoveItemPosition: 'left bottom',
                    styleButtonProcessItemPosition: 'right bottom',
                } : null)} />
        </div>
    );
});

export default AssetUploader;