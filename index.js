import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
const RECONIFY_MODULE_VERSION = '2.4.0';
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

const reconifyOpenAILegacyV3Handler = (openAiApi, config={}) => {
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
                //console.log('response_format:', createImageRequest.response_format);
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

//open ai v4
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
            response: output,
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

        let copy = {...output};
        let n = copy.data.length;
        //console.log(`num images: ${n}`)
        let filenames = [];
        let randomId = uuidv4()
        for (let i=0; i< n; i++){
            filenames.push(`${randomId}-${copy.created}-${i}.png`);
        }

        copy.data = filenames;
        //log interaction without image data
        logInteraction(input, copy, timestampIn, timestampOut, type);

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
                    data: output.data[i],
                    format: 'b64_json'
                }
            })
        }
        return;
    }

    //override method
    const reconifyCreateChatCompletion = async (createChatCompletionRequest, options) => {

        let tsIn = Date.now();
        let response = await openAiApi.chat.completions.originalCreateChatCompletion(createChatCompletionRequest, options);
        let tsOut = Date.now();

        //async logging
        logInteraction(createChatCompletionRequest, response, tsIn, tsOut, 'chat');

        return response;
    }

    //override method
    const reconifyCreateCompletion = async (createCompletionRequest, options) => {
        let tsIn = Date.now();
        let response = await openAiApi.completions.originalCreateCompletion(createCompletionRequest, options);
        let tsOut = Date.now();
    
        //async logging
        logInteraction(createCompletionRequest, response, tsIn, tsOut, 'completion');

        return response;
    }

    const reconifyCreateImage = async (createImageRequest, options) => {
        let tsIn = Date.now();
        let response = await openAiApi.images.originalCreateImage(createImageRequest, options);
        let tsOut = Date.now();
    
        if(_trackImages) {
            if(createImageRequest.response_format == null || createImageRequest.response_format == 'url'){
                logInteraction(createImageRequest, response, tsIn, tsOut, 'image');
            }
            else {
                //send images separately 
                //console.log('response_format:', createImageRequest.response_format);
                logInteractionWithImageData(createImageRequest, response, tsIn, tsOut, 'image');
            }
        }
       
        return response;
    }

    //set handler for chat 
    openAiApi.chat.completions.originalCreateChatCompletion = openAiApi.chat.completions.create; 
    openAiApi.chat.completions.create = reconifyCreateChatCompletion;
    //set handler for completion - legacy
    openAiApi.completions.originalCreateCompletion = openAiApi.completions.create; 
    openAiApi.completions.create = reconifyCreateCompletion;
    //set handler for image creation 
    openAiApi.images.originalCreateImage = openAiApi.images.generate; 
    openAiApi.images.generate = reconifyCreateImage;

    return {setUser, setSession, setSessionTimeout}

}

//Bedrock support
const reconifyBedrockRuntimeHandler = (config={}) => {
    const _format = 'bedrock';
    const _appKey = config.appKey ? config.appKey : null;
    const _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
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
        /**/
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
                format: _format,
                appKey: _appKey,
                apiKey: _apiKey,
                type: type,
                version: RECONIFY_MODULE_VERSION,
            },
            request: input,
            response: output,
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
        let requestId = output.requestId;
        let body = output.body; 
        let data = body?.artifacts;
        if(input?.modelId?.startsWith('amazon.')){
            data = body.images.map( (x) => { return { base64: x, seed:null, finishReason:null } })
        }
        let n = data.length;

        let images = [];
        let randomId = uuidv4()
        for (let i=0; i< n; i++){
            images.push({
                filename: `${randomId}-${timestampIn}-${i}.png`,
                seed: data[i]["seed"],
                finishReason: data[i]["finishReason"]
            });
        }

        //log interaction without image data
        logInteraction(input, {requestId: requestId, body: {images:images, format:'b64_json'}}, timestampIn, timestampOut, type);

        //send each image
        for (let i=0; i< n; i++){
            uploadImage({
                reconify :{
                    format: _format,
                    appKey: _appKey,
                    apiKey: _apiKey,
                    type: 'image-upload',
                    version: RECONIFY_MODULE_VERSION,
                },
                upload: {
                    filename: images[i]["filename"],
                    type: 'response-image',
                    data: {'b64_json':data[i]["base64"]},
                    format: 'b64_json'
                }
            })
        }
        return;
    }

    const plugin = () => {
        return {
            applyToStack: (stack) => {
                stack.add(
                    (next, context) => async (args) => {
                        let tsIn = Date.now();
                        const result = await next(args)
                        let tsOut = Date.now();

                        const decoder = new TextDecoder('utf-8')
                        let body =  JSON.parse(decoder.decode(result?.output?.body))
                        let requestId = (result?.output["$metadata"] != null) ? result.output["$metadata"].requestId : null;
                        let input = args?.input 
                        let model = input?.modelId ? input.modelId : '';
                        if(model.startsWith('anthropic.') || model.startsWith('ai21.') || model.startsWith('cohere.')
                            || model.startsWith('meta.') || model.startsWith('amazon.titan-text')){
                            logInteraction(input, {body: body, requestId: requestId}, tsIn, tsOut, 'chat')
                        } else if (model.startsWith('stability.') || model.startsWith('amazon.titan-image')) {
                            logInteractionWithImageData(input, {body: body, requestId: requestId}, tsIn, tsOut, 'image')
                        }
                        return result
                    }, 
                    {step:"deserialize",name:"ReconifyBedrockRuntimeHandler"}
                )
            }
        }
    }

    return {plugin, setUser, setSession, setSessionTimeout}

}
//cohere
const reconifyCohereHandler = (cohere, config={}) => {
    const _format = "cohere";
    const _appKey = config.appKey ? config.appKey : null;
    const _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
    }
    if(cohere == null) {
        throw new Error('The cohere instance is required');
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

    const logInteraction = async (input, output, timestampIn, timestampOut, type) => {
        if (_debug == true) {
            console.log('logInteraction');
        }
        //base payload
        let payload = {
            reconify :{
                format: _format,
                appKey: _appKey,
                apiKey: _apiKey,
                type: type,
                version: RECONIFY_MODULE_VERSION,
            },
            request: input,
            response: output,
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
    const reconifyChat = async (req, options) => {

        let tsIn = Date.now();
        let response = await cohere.originalChat(req, options);
        let tsOut = Date.now();

        //async logging
        logInteraction(req, response, tsIn, tsOut, 'chat');

        return response;
    }

    //override method
    const reconifyGenerate = async (req, options) => {
        let tsIn = Date.now();
        let response = await cohere.originalGenerate(req, options);
        let tsOut = Date.now();
    
        //async logging
        logInteraction(req, response, tsIn, tsOut, 'generate');

        return response;
    }

    //set handler for chat 
    cohere.originalChat = cohere.chat; 
    cohere.chat = reconifyChat;
    //set handler for generations
    cohere.originalGenerate = cohere.generate; 
    cohere.generate = reconifyGenerate;

    return {setUser, setSession, setSessionTimeout}

}

//anthropic
const reconifyAnthropicHandler = (anthropic, config={}) => {
    const _format = "anthropic";
    const _appKey = config.appKey ? config.appKey : null;
    const _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
    }
    if(anthropic == null) {
        throw new Error('The anthropic instance is required');
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

    const logInteraction = async (input, output, timestampIn, timestampOut, type) => {
        if (_debug == true) {
            console.log('logInteraction');
        }
        //base payload
        let payload = {
            reconify :{
                format: _format,
                appKey: _appKey,
                apiKey: _apiKey,
                type: type,
                version: RECONIFY_MODULE_VERSION,
            },
            request: input,
            response: output,
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
    const reconifyCompletion = async (req, options) => {
        let tsIn = Date.now();
        let response = await anthropic.completions.originalCreateCompletion(req, options);
        let tsOut = Date.now();
    
        //async logging
        logInteraction(req, response, tsIn, tsOut, 'chat');

        return response;
    }

    //set handler for completions 
    anthropic.completions.originalCreateCompletion = anthropic.completions.create; 
    anthropic.completions.create = reconifyCompletion;

    return {setUser, setSession, setSessionTimeout}

}
//google gemini
const reconifyGeminiHandler = (gemini, config={}) => {
    const _format = "gemini";
    const _appKey = config.appKey ? config.appKey : null;
    const _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
    }
    if(gemini == null) {
        throw new Error('The Google Gemini instance is required');
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
                format: _format,
                appKey: _appKey,
                apiKey: _apiKey,
                type: type,
                version: RECONIFY_MODULE_VERSION,
            },
            request: input,
            ...output,
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

        let copy = {...input};
        let n = copy.contents.length;
        //console.log(`num images: ${n}`)
        let filenames = [];
        let prompt = "";
        let randomId = uuidv4()
        let data = [];
        for (let i=0; i< n; i++){
            if(copy.contents[i].hasOwnProperty("inlineData")) {
                let mime = copy.contents[i].inlineData?.mimeType; 
                let ext = 'png'
                switch (mime) {
                    case 'image/png':
                        ext = 'png'
                        break;
                    case 'image/jpeg':
                        ext = 'jpg'
                        break;
                    case 'image/jpg':
                        ext = 'jpg'
                        break;
                    case 'image/webp':
                        ext = 'webp'
                        break;
                    case 'image/heic':
                        ext = 'heic'
                        break;
                    case 'image/heif':
                        ext = 'heif'
                        break;
                    default:
                        ext = 'png'
                        break;
                }
                //if(mime == 'image/jpeg' || mime == 'image/jpg') {ext = 'jpg'}
                //filenames.push(`${randomId}-${timestampIn}-${i}.${ext}`);
                filenames.push({filename:`${randomId}-${timestampIn}-${i}.${ext}`});
                data.push(copy.contents[i].inlineData?.data)
            } else {
                prompt = copy.contents[i]
            }
        }
        //copy.input = {prompt: prompt, images: filenames}
        copy.contents = [{parts:[{text:prompt}, ...filenames]}]

        //log interaction without image data
        logInteraction(copy, output, timestampIn, timestampOut, type);

        //send each image (image for in vs response-image for out)
        for (let i=0; i< data.length; i++){
            uploadImage({
                reconify :{
                    format: _format,
                    appKey: _appKey,
                    apiKey: _apiKey,
                    type: 'image-upload',
                    version: RECONIFY_MODULE_VERSION,
                },
                upload: {
                    filename: filenames[i].filename,
                    type: 'image',
                    data: {b64_json: data[i]},
                    format: 'b64_json'
                }
            })
        }
        return;
    }

    //override get model
    const reconifyGetGenerativeModel = (modelParams) => {
        let geminiModel = null;
        try {
            geminiModel = gemini.originalGetGenerativeModel(modelParams)
        } catch(err) {
            throw err
        }

        //override generate content method
        const reconifyGenerateContent = async (options) => {

            let tsIn = Date.now();
            let response = await geminiModel.originalGenerateContent(options);
            let tsOut = Date.now();

            //async logging
            if(modelParams?.model.startsWith('gemini-pro-vision')){
                logInteractionWithImageData({contents:[...options], ...modelParams}, response, tsIn, tsOut, 'image');
            } else {
                logInteraction({contents:[{parts:[{text:options}]}], ...modelParams}, response, tsIn, tsOut, 'generate');
            }

            return response;
        }

        //set handler for generate content 
        geminiModel.originalGenerateContent = geminiModel.generateContent; 
        geminiModel.generateContent = reconifyGenerateContent;

        //override chat
        const reconifyStartChat = (chatParams) => {
            let geminiChat = null;
            try {
                geminiChat = geminiModel.originaStartChat(chatParams)
            } catch(err) {
                throw err
            }

            const reconifySendMessage = async (input) => {
                let tsIn = Date.now();
                let response = await geminiChat.originalSendMessage(input);
                let tsOut = Date.now();
    
                //async logging
                //logInteraction({input: input, config: modelParams, chatConfig: chatParams }, response, tsIn, tsOut, 'chat');
                logInteraction({contents:[{role: "user", parts:[{text:input}]}], model: modelParams?.model, ...chatParams }, response, tsIn, tsOut, 'chat');
                return response;
            }
            geminiChat.originalSendMessage = geminiChat.sendMessage; 
            geminiChat.sendMessage = reconifySendMessage;

            return geminiChat
        }
        geminiModel.originaStartChat = geminiModel.startChat; 
        geminiModel.startChat = reconifyStartChat;

        return geminiModel
    } 

    //set handler for get model
    gemini.originalGetGenerativeModel = gemini.getGenerativeModel; 
    gemini.getGenerativeModel = reconifyGetGenerativeModel;

    return {setUser, setSession, setSessionTimeout}

}

//Mistral
const reconifyMistralHandler = (mistral, config={}) => {
    const _format = "mistral";
    const _appKey = config.appKey ? config.appKey : null;
    const _apiKey = config.apiKey ? config.apiKey : null;
    if(_apiKey == null || _apiKey == '' || _appKey == null || _appKey == ''){
        throw new Error('An appKey and apiKey are required');
    }
    if(mistral == null) {
        throw new Error('The mistral instance is required');
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


    const logInteraction = async (input, output, timestampIn, timestampOut, type) => {
        if (_debug == true) {
            console.log('logInteraction');
        }
        //base payload
        let payload = {
            reconify :{
                format: _format,
                appKey: _appKey,
                apiKey: _apiKey,
                type: type,
                version: RECONIFY_MODULE_VERSION,
            },
            request: input,
            response: output,
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
    const reconifyChat = async (options) => {

        let tsIn = Date.now();
        let response = await mistral.originalChat(options);
        let tsOut = Date.now();

        //async logging
        logInteraction(options, response, tsIn, tsOut, 'chat');

        return response;
    }


    //set handler for chat 
    mistral.originalChat = mistral.chat; 
    mistral.chat = reconifyChat; 

    return {setUser, setSession, setSessionTimeout}

}


export {reconifyOpenAILegacyV3Handler, reconifyOpenAIHandler, reconifyBedrockRuntimeHandler, 
    reconifyCohereHandler, reconifyAnthropicHandler, reconifyGeminiHandler,
    reconifyMistralHandler};
