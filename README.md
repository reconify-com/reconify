# Reconify module

The Reconify module is used for sending data to the Reconify platform at [www.reconify.com](https://www.reconify.com). 

Currently the module supports processing and analyzing Chats, Completions, and Images from:
+ **[OpenAI](#integrate-the-module-with-openai)** 
+ **[Amazon Bedrock](#integrate-the-module-with-amazon-bedrock-runtime)**  (Amazon Titan, AI21 Jurassic, Anthropic Claude, Cohere Command, Meta Llama 2, and Stability Stable Diffusion)
+ **[Anthropic](#integrate-the-module-with-anthropic)**
+ **[Cohere](#integrate-the-module-with-cohere)**
+ **[Google Gemini](#integrate-the-module-with-google-gemini)**

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

## Integrate the module with OpenAI

The following instructions are for OpenAI's Node NPM v4 or later (released in Nov 2023). For earlier versions of OpenAI's NPM, follow the [legacy instructions](https://www.reconify.com/docs/openai/legacy)

### Import the module
```javascript
import {reconifyOpenAIHandler} from 'reconify';
```

### Create an instance
Prior to initializing the Reconify module, create an instance of OpenAI which will be passed to the module.

```javascript
const openai = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});
```

Create the instance of Reconify passing the OpenAi instance along with the Reconify API_KEY and APP_KEY created above.

```javascript
const reconify = reconifyOpenAIHandler(openai, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
```

This is all that is needed for a basic integration. The module takes care of sending the correct data to Reconify. 

#### Optional Config Parameters 
There are additional optional parameters that can be passed in to the handler. 

+ debug: (default false) Enable/Disable console logging
+ trackImages: (default true) Turn on/off tracking of createImage 

For example:

```javascript
const reconify = reconifyOpenAIHandler(openai, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
   debug: true
});
```


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

See [Examples with OpenAI](#examples-with-openai)

## Integrate the module with Amazon Bedrock Runtime

### Import the module
```javascript
import {reconifyBedrockRuntimeHandler} from 'reconify';
import {BedrockRuntimeClient, InvokeModelCommand} from "@aws-sdk/client-bedrock-runtime";
```

### Create instances of Bedrock and the Reconify Middleware
Create an instance of the BedrockRuntimeClient.

```javascript
const client = new BedrockRuntimeClient({
   region: "us-west-2"
});
```

Create the instance of Reconify with the Reconify API_KEY and APP_KEY created above.

```javascript
const reconify = reconifyBedrockRuntimeHandler({
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
```

### Add Reconify as a Bedrock Runtime Middleware
```javascript
client.middlewareStack.use(reconify.plugin());
```

This is all that is needed for a basic integration. The module takes care of sending the correct data to Reconify. 

#### Optional Config Parameters 
There are additional optional parameters that can be passed in to the handler. 

+ debug: (default false) Enable/Disable console logging
+ trackImages: (default true) Turn on/off tracking of images 

For example:

```javascript
const reconify = reconifyBedrockRuntimeHandler({
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
   debug: true
});
```


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

See [Examples with Amazon Bedrock Runtime](#examples-with-bedrock-runtime)

## Integrate the module with Anthropic

The following instructions are for Anthropic's Node NPM. 

### Import the module
```javascript
import {reconifyAnthropicHandler} from 'reconify';
```

### Create an instance
Prior to initializing the Reconify module, create an instance of Anthropic which will be passed to the module.

```javascript
const anthropic = new Anthropic({
   apiKey: process.env.ANTHROPIC_API_KEY,
});
```

Create the instance of Reconify passing the Anthropic instance along with the Reconify API_KEY and APP_KEY created above.

```javascript
const reconify = reconifyAnthropicHandler(anthropic, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
```

This is all that is needed for a basic integration. The module takes care of sending the correct data to Reconify. 

#### Optional Config Parameters 
There are additional optional parameters that can be passed in to the handler. 

+ debug: (default false) Enable/Disable console logging
+ trackImages: (default true) Turn on/off tracking of createImage 

For example:

```javascript
const reconify = reconifyAnthropicHandler(anthropic, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
   debug: true
});
```


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

See [Examples with Anthropic](#examples-with-anthropic)

## Integrate the module with Cohere

The following instructions are for Cohere's Node NPM. 

### Import the module
```javascript
import {reconifyCohereHandler} from 'reconify';
```

### Create an instance
Prior to initializing the Reconify module, create an instance of Cohere which will be passed to the module.

```javascript
const cohere = new CohereClient({
   token: process.env.COHERE_API_KEY,
});
```

Create the instance of Reconify passing the Cohere instance along with the Reconify API_KEY and APP_KEY created above.

```javascript
const reconify = reconifyCohereHandler(cohere, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
```

This is all that is needed for a basic integration. The module takes care of sending the correct data to Reconify. 

#### Optional Config Parameters 
There are additional optional parameters that can be passed in to the handler. 

+ debug: (default false) Enable/Disable console logging
+ trackImages: (default true) Turn on/off tracking of createImage 

For example:

```javascript
const reconify = reconifyCohereHandler(cohere, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
   debug: true
});
```


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

See [Examples with Cohere](#examples-with-cohere)

## Integrate the module with Google Gemini

The following instructions are for Google's Node NPM. 

### Import the module
```javascript
import {reconifyGeminiHandler} from 'reconify';
```

### Create an instance
Prior to initializing the Reconify module, create an instance of Google Gemini which will be passed to the module.

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

Create the instance of Reconify passing the Gemini instance along with the Reconify API_KEY and APP_KEY created above.

```javascript
const reconify = reconifyCohereHandler(genAI, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
```

This is all that is needed for a basic integration. The module takes care of sending the correct data to Reconify. 

#### Optional Config Parameters 
There are additional optional parameters that can be passed in to the handler. 

+ debug: (default false) Enable/Disable console logging
+ trackImages: (default true) Turn on/off tracking of createImage 

For example:

```javascript
const reconify = reconifyCohereHandler(genAI, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
   debug: true
});
```


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

See [Examples with Google Gemini](#examples-with-google-gemini)

## Examples with OpenAI

### Chat Example

```javascript
import { OpenAI } from "openai";
import { reconifyOpenAIHandler } from 'reconify';
‍
const openai = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});
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
const completion = await openai.chat.completions.create({
   model: "gpt-3.5-turbo",
   messages: [
   {role: "system", content: "you are an expert on commedians"},
   {role: "user", content: "tell a joke about cats like Jerry Seinfeld"}
   ],
});
```

### Completion Example

```javascript
import { OpenAI } from "openai";
import { reconifyOpenAIHandler } from 'reconify';
‍
const openai = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});
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
const completion = await openai.completions.create({
   model: "text-davinci-003",
   prompt: "write a haiku about cats",
   max_tokens: 100,
   temperature: 0,
});
```

### Image Example

```javascript
import { OpenAI } from "openai";
import { reconifyOpenAIHandler } from 'reconify';
‍
const openai = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});
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
const result = await openai.images.generate({
   model: "dall-e-3"
   prompt: "a cat on the moon",
   n: 1,
   size: "1024x1024",
   response_format: "url"
});
```

## Examples with Bedrock Runtime

### Anthropic Claude Example

```javascript
import {BedrockRuntimeClient, InvokeModelCommand} from "@aws-sdk/client-bedrock-runtime";
import {reconifyBedrockRuntimeHandler} from 'reconify';

const client = new BedrockRuntimeClient({
   region: "us-west-2",
   credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY
   } 
})
‍
const reconify = reconifyBedrockRuntimeHandler({
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});

client.middlewareStack.use(reconify.plugin());
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const command = new InvokeModelCommand({
   modelId: "anthropic.claude-instant-v1",
   contentType: "application/json",
   accept: "application/json",
   body: "{\"prompt\":\"\\n\\nHuman: Tell a cat joke.\\n\\nAssistant:\",\"max_tokens_to_sample\":300,\"temperature\":1,\"top_k\":250,\"top_p\":0.999,\"stop_sequences\":[\"\\n\\nHuman:\"],\"anthropic_version\":\"bedrock-2023-05-31\"}"
});

const results = await client.send(command)
```

### Stable Diffusion Image Example

```javascript
import {BedrockRuntimeClient, InvokeModelCommand} from "@aws-sdk/client-bedrock-runtime";
import {reconifyBedrockRuntimeHandler} from 'reconify';

const client = new BedrockRuntimeClient({
   region: "us-west-2",
   credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY
   } 
})
‍
const reconify = reconifyBedrockRuntimeHandler({
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});

client.middlewareStack.use(reconify.plugin());
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const command = new InvokeModelCommand({
   modelId: "stability.stable-diffusion-xl-v0",
   contentType: "application/json",
   accept: "application/json",
   body: "{\"text_prompts\":[{\"text\":\"a cat drinking boba tea\"}],\"cfg_scale\":10,\"seed\":0,\"steps\":50}"
});

const results = await client.send(command)
```

## Examples with Anthropic

### Completions Example

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { reconifyAnthropicHandler } from 'reconify';
‍
const anthropic = new Anthropic({
   apiKey: process.env.ANTHROPIC_API_KEY,
});
‍
const reconify = reconifyAnthropicHandler(anthropic, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const completion = await anthropic.completions.create({
   model: "claude-2",
   max_tokens_to_sample: 300,
   prompt: `${Anthropic.HUMAN_PROMPT} Tell me a cat joke${Anthropic.AI_PROMPT}`
});
```


## Examples with Cohere

### Chat Example

```javascript
import { CohereClient } from "cohere-ai";
import { reconifyCohereHandler } from 'reconify';
‍
const cohere = new CohereClient({
   token: process.env.COHERE_API_KEY,
});
‍
const reconify = reconifyCohereHandler(cohere, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const completion = await cohere.chat({
   model: "command",
   message: "Tell me a cat joke"
});
```

### Generate Example

```javascript
import { CohereClient } from "cohere-ai";
import { reconifyCohereHandler } from 'reconify';
‍
const cohere = new CohereClient({
   token: process.env.COHERE_API_KEY,
});
‍
const reconify = reconifyCohereHandler(cohere, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const completion = await cohere.generate({
   model: "command",
   message: "Write a cat haiku",
   max_tokens: 300
});
```


## Examples with Google Gemini

### Generate Example

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { reconifyGeminiHandler } from 'reconify';
‍
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
‍
const reconify = reconifyGeminiHandler(genAI, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const result = await model.generateContent("Tell me a cat joke");
const response = await result.response;
const text = response.text();
```

### Generate with Images Example

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { reconifyGeminiHandler } from 'reconify';
import * as fs from 'fs';
‍
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
‍
const reconify = reconifyGeminiHandler(genAI, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const fileToGenerativePart = (path, mimeType) => {
   return {
      inlineData: {
         data: Buffer.from(fs.readFileSync(path)).toString("base64"),
         mimeType
      },
   };
}

const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
const imageParts = [fileToGenerativePart("holiday-cat.jpg", "image/jpeg")];
const result = await model.generateContent(["Describe this photo", ...imageParts]);
const response = await result.response;
const text = response.text();
```

### Chat Example

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { reconifyGeminiHandler } from 'reconify';
‍
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
‍
const reconify = reconifyGeminiHandler(genAI, {
   appKey: process.env.RECONIFY_APP_KEY, 
   apiKey: process.env.RECONIFY_API_KEY,
});
‍
reconify.setUser({
   userId: "12345",
   firstName: "Jane",
   lastName: "Smith"
});
‍
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const chat = model.startChat({
   history: [
         { role: "user", parts: "I have a tuxedo cat and a calico cat"},
         { role: "model", parts: "How can I help?"}
   ],
   generationConfig: {
         maxOutputTokens: 200
   }
})

const result = await chat.sendMessage("How many colors are my cats?")
const response = await result.response;
const text = response.text();
```