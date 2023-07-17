import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
const RECONIFY_MODULE_VERSION = '1.0.2';
const RECONIFY_TRACKER = 'https://track.reconify.com/track';
const RECONIFY_UPLOADER = 'https://track.reconify.com/upload';

// currently not used
const reconifyApi = (config={}) => {    

    let _appKey = config.appKey ? config.appKey : null;
    let _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
    }

    let _debug = config.debug ? (config.debug == true ? true : false): false;
    let _tracker = config.tracker ? config.tracker : RECONIFY_TRACKER;
    let _uploader = config.uploader ? config.uploader : RECONIFY_UPLOADER;

    let payload = {
        reconify :{
            appKey: _appKey,
            apiKey: _apiKey,
            version: RECONIFY_MODULE_VERSION,
        }
    }

    const transmit = async (payload) => {
        if (_debug == true) {
            console.log("transmitting payload: ", JSON.stringify(payload))
        }
        await axios.post(_tracker, payload)
        .then((res) => {
            if (res.data.status == 'ok') {
                if (_debug == true) {
                    console.log('transmit success');
                }
            } else {
                if (_debug == true) {
                    console.log('transmit failure');
                }
            }
        })
        .catch((err) => {
            if (_debug == true) {
                console.log('transmit error', err);
            }
        });
    }

    const logOpenAIChat = (input, output, meta={}) => {

        payload.reconify.format = 'openai';
        payload.reconify.type = 'chat';
        payload.request = input;
        payload.response = output.data ? output.data : null;
        payload.user = meta.user ? meta.user : {};
        payload.session = meta.session ? meta.session : null;

        transmit(payload);
        return;
    }
    const logOpenAICompletion = (input, output, meta={}) => {

        payload.reconify.format = 'openai';
        payload.reconify.type = 'completion';
        payload.request = input;
        payload.response = output.data ? output.data : null;
        payload.user = meta.user ? meta.user : {};
        payload.session = meta.session ? meta.session : null;

        transmit(payload);
        return;
    }
    
    return { logOpenAIChat, logOpenAICompletion}
}

const reconifyOpenAIHandler = (openAiApi, config={}) => {
    const _appKey = config.appKey ? config.appKey : null;
    const _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
    }
    if(openAiApi == null) {
        throw new Error('The openAI instance is required');
    }
    //optional config overrides
    let _debug = config.debug ? (config.debug == true ? true : false): false;
    let _tracker = config.tracker ? config.tracker : RECONIFY_TRACKER;
    let _uploader = config.uploader ? config.uploader : RECONIFY_UPLOADER;
    let _trackImages = config.hasOwnProperty('trackImages') ? config.trackImages : true;

    //optional meta data
    let _user = {};
    let _session = null; 
    let _sessionTimeout = null;

    const setUser = (user = {}) => {
        //if(user != null){
            _user = user;
        //}
    }
    const setSession = (session) => {
        //if(session != null){
            _session = session;
        //}
    }
    const setSessionTimeout = (sessionTimeout) => {
        if(!isNaN(sessionTimeout)){
            _sessionTimeout = sessionTimeout;
        }
    }

    const transmit = async (payload) => {
        if (_debug == true) {
            console.log("transmitting payload: ", JSON.stringify(payload))
        }
        await axios.post(_tracker, payload)
        .then((res) => {
            if (res.data.status == 'ok') {
                if (_debug == true) {
                    console.log('transmit success');
                }
            } else {
                if (_debug == true) {
                    console.log('transmit failure');
                }
            }
        })
        .catch((err) => {
            if (_debug == true) {
                console.log('transmit error', err);
            }
        });
        return;
    }

    const uploadImage = async (payload) => {
        if (_debug == true) {
            console.log("uploading image: ", JSON.stringify(payload))
        }
        await axios.post(_uploader, payload)
        .then((res) => {
            if (res.data.status == 'ok') {
                if (_debug == true) {
                    console.log('upload success');
                }
            } else {
                if (_debug == true) {
                    console.log('upload failure');
                }
            }
        })
        .catch((err) => {
            if (_debug == true) {
                console.log('upload error', err);
            }
        });
        return;
    }

    const logInteraction = async (input, output, timestampIn, timestampOut, type) => {
        if (_debug == true) {
            console.log('logInteraction');
        }
        //base payload
        let payload = {
            reconify :{
                format: 'openai',
                appKey: _appKey,
                apiKey: _apiKey,
                type: type,
                version: RECONIFY_MODULE_VERSION,
            },
            request: input,
            response: (output.data ? output.data : null),
            user: _user,
            session: _session,
            sessionTimeout: _sessionTimeout,
            timestamps: {
                request: timestampIn,
                response: timestampOut
            },
        }
        transmit(payload);
        return;
    }

    const logInteractionWithImageData = async (input, output, timestampIn, timestampOut, type) => {
        if (_debug == true) {
            console.log('logInteractionWithImageData');
        }

        let copy = {...output.data};
        let n = copy.data.length;
        //console.log(`num images: ${n}`)
        let filenames = [];
        let randomId = uuidv4()
        for (let i=0; i< n; i++){
            filenames.push(`${randomId}-${copy.created}-${i}.png`);
        }

        copy.data = filenames;
        //log interaction without image data
        logInteraction(input, {data:copy}, timestampIn, timestampOut, type);

        //send each image
        for (let i=0; i< n; i++){
            uploadImage({
                reconify :{
                    format: 'openai',
                    appKey: _appKey,
                    apiKey: _apiKey,
                    type: 'image-upload',
                    version: RECONIFY_MODULE_VERSION,
                },
                upload: {
                    filename: filenames[i],
                    type: 'response-image',
                    data: output.data.data[i],
                    format: 'b64_json'
                }
            })
        }
        return;
    }

    //override method
    const reconifyCreateChatCompletion = async (createChatCompletionRequest, options) => {

        let tsIn = Date.now();
        let response = await openAiApi.originalCreateChatCompletion(createChatCompletionRequest, options);
        let tsOut = Date.now();

        //async logging
        logInteraction(createChatCompletionRequest, response, tsIn, tsOut, 'chat');

        return response;
    }

    //override method
    const reconifyCreateCompletion = async (createCompletionRequest, options) => {
        let tsIn = Date.now();
        let response = await openAiApi.originalCreateCompletion(createCompletionRequest, options);
        let tsOut = Date.now();
    
        //async logging
        logInteraction(createCompletionRequest, response, tsIn, tsOut, 'completion');

        return response;
    }

    const reconifyCreateImage = async (createImageRequest, options) => {
        let tsIn = Date.now();
        let response = await openAiApi.originalCreateImage(createImageRequest, options);
        let tsOut = Date.now();
    
        if(_trackImages) {
            if(createImageRequest.response_format == null || createImageRequest.response_format == 'url'){
                logInteraction(createImageRequest, response, tsIn, tsOut, 'image');
            }
            else {
                //send images separately 
                console.log('response_format:', createImageRequest.response_format);
                logInteractionWithImageData(createImageRequest, response, tsIn, tsOut, 'image');
            }
        }
       
        return response;
    }

    //set handler for chat 
    openAiApi.originalCreateChatCompletion = openAiApi.createChatCompletion; 
    openAiApi.createChatCompletion = reconifyCreateChatCompletion;
    //set handler for completion 
    openAiApi.originalCreateCompletion = openAiApi.createCompletion; 
    openAiApi.createCompletion = reconifyCreateCompletion;
    //set handler for image creation 
    openAiApi.originalCreateImage = openAiApi.createImage; 
    openAiApi.createImage = reconifyCreateImage;

    return {setUser, setSession, setSessionTimeout}

}

export {reconifyOpenAIHandler};
