# Reconify module

The Reconify module is used for sending data to the Reconify platform at [www.reconify.com](https://www.reconify.com). 

Currently the module supports processing and analyzing Chats and Completions from OpenAI. 
Support for additional actions and providers will be added.

## Get started
The first step is to create an account at [app.reconify.com](https://app.reconify.com).

## Generate API and APP Keys
In the Reconify console, add an Application to your account. This will generate both an API_KEY and an APP_KEY 
which will be used in the code below to send data to Reconify.

## Install the module

```
npm install reconify --save
```

## Integrate the module in code

### Import the module
```javascript
import {reconifyOpenAIHandler} from 'reconify';
```

### Create an instance
Prior to initializing the Reconify module, create an instance of OpenAI which will be passed to the module.

```javascript
const openai = new OpenAIApi(new Configuration({
   apiKey: process.env.OPENAI_API_KEY,
}));
```

Create the instance of Reconify passing the OpenAi instance along with the Reconify API_KEY and APP_KEY created above.

```javascript
const reconify = reconifyOpenAIHandler(openai, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
```

This is all that is needed for a basic integration. The module takes care of sending the correct data to Reconify. 

There are additional optional parameters as well:

### Optional methods

You can optionally pass in a user object or session ID to be used in the analytics reporting. 
The session ID will be used to group interactions together in the same session transcript.

#### Set a user
The user JSON should include a unique userId, all the other fields are optional. 
Without a unique userId, each user will be treated as a new user.

```javascript
reconify.setUser ({
   "userId": "ABC123",
   "isAuthenticated": 1,
   "firstName": "Francis",
   "lastName": "Smith",
   "email": "",
   "phone": "",
   "gender": "female"
});
```

#### Set a Session ID
The Session ID is an alphanumeric string.
```javascript
reconify.setSession('MySessionId');
```

#### Set a Session Timeout
Set the session timeout in minutes to override the default
```javascript
reconify.setSessionTimeout(15);
```

## Examples

### Chat Example

```javascript
import { Configuration, OpenAIApi } from "openai";
import { reconifyOpenAIHandler } from 'reconify';
‍
const configuration = new Configuration({
   apiKey: process.env.OPENAI_API_KEY,
});
‍
const openai = new OpenAIApi(configuration);
‍
const reconify = reconifyOpenAIHandler(openai, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   isAuthenticated: 1,
   firstName: "Jim",
   lastName: "Stand",
   gender: "male"
});
‍
const completion = await openai.createChatCompletion({
   model: "gpt-3.5-turbo",
   messages: [
   {role: "system", content: "you are an expert on commedians"},
   {role: "user", content: "tell a joke about cats like Jerry Seinfeld"}
   ],
});
```

### Completion Example

```javascript
import { Configuration, OpenAIApi } from "openai";
import { reconifyOpenAIHandler } from 'reconify';
‍
const configuration = new Configuration({
   apiKey: process.env.OPENAI_API_KEY,
});
‍
const openai = new OpenAIApi(configuration);
‍
const reconify = reconifyOpenAIHandler(openai, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   isAuthenticated: 1,
   firstName: "Jim",
   lastName: "Stand",
   gender: "male"
});
‍
const completion = await openai.createCompletion({
   model: "text-davinci-003",
   prompt: "write a haiku about cats",
   max_tokens: 100,
   temperature: 0,
});
```
