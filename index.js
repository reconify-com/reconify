
import axios from 'axios';

const reconify = (appKey, apiKey, format, action, debug = false) => {

    let _debug = (debug != null && debug == true) ? true : false;
    let _tracker = 'http://localhost:5050/track';

    let payload = {
        reconify :{
            format: format,
            appKey: appKey,
            apiKey: apiKey,
            type: action,
            version: '1.0.0'
        }
    }

    const transmit = async (payload) => {
        if (_debug == true) {
            console.log("transmitting payload: ", payload)
        }
        await axios.post(_tracker, payload)
        .then((res) => {
            if (res.data.status === 'ok') {
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

    const logInteraction = async (request, response, session = '', user = {}) => {
        if (request == null || Object.keys(request).length === 0) {
            //error
            if (_debug == true) {
                console.log("the prompts were missing")
            }
            return false;
        }
        if (response == null) {
            //error
            if (_debug == true) {
                console.log("the response was missing")
            }
            return false;
        }

        

        //TODO verify schema?
        payload.request = request;
        payload.response = response;
        if(session != null){
            payload.session = session;
        }
        if(user != null) {
            payload.user = user;
        }
        
        //if (_debug == true) {
        //    console.log('payload:', payload);
        //}
        transmit(payload);
        return;
/*
        await axios.post('http://localhost:5050/track', payload)
            .then((res) => {
                if (res.data.status === 'ok') {
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
*/

    }
    return { logInteraction }
}
//module.exports = { reconify };
export default reconify;
