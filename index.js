
import axios from 'axios';
const RECONIFY_MODULE_VERSION = '1.0.0';
const RECONIFY_TRACKER = 'https://track.reconify.com/track';

// currently not used
const reconifyApi = (config={}) => {    

    let _appKey = config.appKey ? config.appKey : null;
    let _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
    }

    let _debug = config.debug ? (config.debug == true ? true : false): false;
    let _tracker = config.tracker ? config.tracker : RECONIFY_TRACKER;

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

    //set handler for chat 
    openAiApi.originalCreateChatCompletion = openAiApi.createChatCompletion; 
    openAiApi.createChatCompletion = reconifyCreateChatCompletion;
    //set handler for completion 
    openAiApi.originalCreateCompletion = openAiApi.createCompletion; 
    openAiApi.createCompletion = reconifyCreateCompletion;

    return {setUser, setSession, setSessionTimeout}

}

export {reconifyOpenAIHandler};
