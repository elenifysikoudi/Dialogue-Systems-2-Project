import { text } from "stream/consumers";
import { setup, createActor, fromPromise, assign } from "xstate";

const FURHATURI = "127.0.0.1:54321" ;
 //"192.168.1.236:54321" ;


async function getRandomFromList(list: string[]): Promise<string> {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

function getRandomFunction(funcs: (() => Promise<any>)[]): Promise<any> {
  const randomIndex = Math.floor(Math.random() * funcs.length);
  return funcs[randomIndex]();
}
const listen_gestures = ['Nod', 'Smile', 'Thoughtful']

const acknowledgements = ["https://raw.githubusercontent.com/elenifysikoudi/Dialogue-Systems-2-Project/main/okay.wav","https://raw.githubusercontent.com/elenifysikoudi/Dialogue-Systems-2-Project/main/hm.wav","https://raw.githubusercontent.com/elenifysikoudi/Dialogue-Systems-2-Project/main/uh-huh.wav","https://raw.githubusercontent.com/elenifysikoudi/Dialogue-Systems-2-Project/main/acknowledgment.wav"]

const initial_prompt = `
You are an interview coach helping the user prepare for an upcoming interview. Your goal is to help them answer questions about their personal traits and soft skills. 
Please, be brief when talking. Greet the user and explain your purpose. You need to first ask the user what field of employment they are interested in. If the user doesn't answer repeat the question. Please refrain from using emojis.` ;

const repeat = `Since the user didn't answer , say that you didn't hear them and repeat the question.`
interface Message {
  role: "assistant" | "user" | "system";
  content: string;
} ; 

async function fhSound(url: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encText = encodeURIComponent(url);
  return fetch(`http://${FURHATURI}/furhat/say?url=${encText}&blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: ""
  });
}

async function fhListenTimeout(timeout=60000) {  // Default timeout is 5000 milliseconds (5 seconds)
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");

  const controller = new AbortController();
  const signal = controller.signal;

  const fetchTimeout = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`http://${FURHATURI}/furhat/listen`, {
      method: "GET",
      headers: myHeaders,
      signal: signal
    });

    const body = await response.body;
    const reader = body.getReader();
    const { value } = await reader.read();
    const message = JSON.parse(new TextDecoder().decode(value)).message;

    clearTimeout(fetchTimeout);
    return message;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Fetch request timed out');
    }
    throw error;
  }
}

async function fhSay(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  const encText = encodeURIComponent(text);
  return fetch(`http://${FURHATURI}/furhat/say?text=${encText}&blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: ""
  });
}

async function fhGetUser() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/users`, {
    method: "GET",
    headers: myHeaders,
  })
}
async function fhAttend() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/attend?user=RANDOM`, {
    method: "POST",
    headers: myHeaders,
  });
}

async function ListeningCarefully() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      name: "ListeningCarefully",
      frames: [
        {
          time: [3.50,3.70], 
          persist: true,
          params: {NECK_PAN : 20.0
          },
        },
        {
          time : [3.50,3.75],
          persist : true ,
          params  :{ BROW_DOWN_LEFT : 0.7 ,
                     BROW_DOWN_RIGHT : 0.7,
                     EYE_SQUINT_LEFT : 0.7,
                     EYE_SQUINT_RIGHT : 0.7

          },
        },
        {
          time: [3.80], //ADD TIME FRAME IN WHICH YOUR GESTURE RESETS
          persist: true,
          params: {
            reset: true,
          },
        },
        //ADD MORE TIME FRAMES IF YOUR GESTURE REQUIRES THEM
      ],
      class: "furhatos.gestures.Gesture",
    }),
  });
}

async function gazeRightSmile() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time":[0.32,7.5],
          "persist":true, 
          "params":{
            "EYE_LOOK_OUT_RIGHT": 0.6,
            "EYE_LOOK_IN_LEFT": 0.6,
            "BROW_DOWN_LEFT": 0.5,
            "BROW_DOWN_RIGHT": 0.5,
            "SMILE_CLOSED": 1,
            "NOSE_SNEER_LEFT": 0.35,
            "NOSE_SNEER_RIGHT": 0.35,
            "EYE_SQUINT_RIGHT": 0.6,
            "EYE_SQUINT_LEFT": 0.6,
          }
        },
        {
          "time":[8.6],
          "persist":true, 
          "params":{
            "reset":true
            }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
} 


async function gazeDown() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time":[0.32,6.0],
          "persist":true, 
          "params":{
            "EYE_LOOK_DOWN_LEFT": 0.6,
            "EYE_LOOK_DOWN_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time":[7.0],
          "persist":true, 
          "params":{
            "reset":true
            }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
} 

async function gazeDownUp() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time": [0.32, 1.5],
          "persist": true,
          "params": {
            "EYE_LOOK_DOWN_LEFT": 0.6,
            "EYE_LOOK_DOWN_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [1.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        },
        {
          "time": [2.0, 3.2],
          "persist": true,
          "params": {
            "EYE_LOOK_UP_LEFT": 0.6,
            "EYE_LOOK_UP_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [3.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
} 


//gaze right
async function gazeLeft() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time":[0.32,4.5],
          "persist":true, 
          "params":{
            "EYE_LOOK_OUT_LEFT": 0.6,
            "EYE_LOOK_IN_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time":[5.6],
          "persist":true, 
          "params":{
            "reset":true
            }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
} 

//gaze left
async function gazeRight() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time":[0.32,6.5],
          "persist":true, 
          "params":{
            "EYE_LOOK_IN_LEFT": 0.6,
            "EYE_LOOK_OUT_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time":[7.6],
          "persist":true, 
          "params":{
            "reset":true
            }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
}

async function gazeUpDown() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time": [0.32, 1.5],
          "persist": true,
          "params": {
            "EYE_LOOK_UP_LEFT": 0.6,
            "EYE_LOOK_UP_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [1.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        },
        {
          "time": [2.0, 3.2],
          "persist": true,
          "params": {
            "EYE_LOOK_DOWN_LEFT": 0.6,
            "EYE_LOOK_DOWN_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [3.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
}

//gaze back and forth
async function gazeLeftToRight() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=true`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time": [0.32, 1.5],
          "persist": true,
          "params": {
            "EYE_LOOK_OUT_LEFT": 0.6,
            "EYE_LOOK_IN_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [1.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        },
        {
          "time": [2.0, 3.2],
          "persist": true,
          "params": {
            "EYE_LOOK_IN_LEFT": 0.6,
            "EYE_LOOK_OUT_RIGHT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [3.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
} 

async function gazeRightToLeft() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/gesture?blocking=false`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      "name":"Laughing",
      "frames":[
        {
          "time": [0.32, 1.5],
          "persist": true,
          "params": {
            "EYE_LOOK_OUT_RIGHT": 0.6,
            "EYE_LOOK_IN_LEFT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [1.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        },
        {
          "time": [2.0, 3.2],
          "persist": true,
          "params": {
            "EYE_LOOK_IN_RIGHT": 0.6,
            "EYE_LOOK_OUT_LEFT": 0.6,
            "BROW_UP_LEFT": 0.5,
            "BROW_UP_RIGHT": 0.5,
          }
        },
        {
          "time": [3.6],
          "persist": true,
          "params": {
            "reset": true,
          }
        }],
      "class":"furhatos.gestures.Gesture"
    })
  })
} 

async function fhGesture(text: string) {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(
    `http://${FURHATURI}/furhat/gesture?name=${text}&blocking=false`,
    {
      method: "POST",
      headers: myHeaders,
      body: "",
    },
  );
}

async function fhListen() {
  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  return fetch(`http://${FURHATURI}/furhat/listen`, {
    method: "GET",
    headers: myHeaders,
  })
    .then((response) => response.body)
    .then((body) => body.getReader().read())
    .then((reader) => reader.value)
    .then((value) => JSON.parse(new TextDecoder().decode(value)).message);
}

const dmMachine = setup({
  actors: {
    get_ollama_models: fromPromise<any, null>(async () => {
      return fetch("http://localhost:11434/api/tags").then((response) =>
        response.json()
      );
    }),
    LLMActor: fromPromise<any,{prompt:Message[]}>(async ({input})=> {
      const body = {
        model: "gemma2",
        messages : input.prompt,
        stream: false,
        temperature : 0.4
      };
      return fetch("http://localhost:11434/api/chat", {
        method: "POST",
        body: JSON.stringify(body),
      }).then((response) => response.json());
   } ), 
    Attend : fromPromise<any, null>(async () => {
      return fhGetUser(); 
    }) ,
    fhL: fromPromise<any, null>(async () => {
     return Promise.all([
      fhAttend() ,
      fhListenTimeout()
     ])
   }),
   ListenCarefully: fromPromise<any, null>(async () => {
    return ListeningCarefully();
   }),
   fhNod : fromPromise<any,any>(async () => {
    return fhGesture('Nod')
   }),
   fhGesture : fromPromise<any,any>(async () => {
    const randomAcknowledgement = await getRandomFromList(acknowledgements) ;
   return getRandomFunction([ () => getRandomFromList(listen_gestures), ListeningCarefully,() => fhSound(randomAcknowledgement)]);
   }),
   fhSpeakG: fromPromise<any, { text: string}>(async ({ input }) => {
    return Promise.all([
      fhAttend() ,
      fhSay(input.text),
      getRandomFunction([gazeDown, gazeDownUp, gazeLeft, gazeLeftToRight, gazeRight, gazeRightSmile, gazeRightToLeft, gazeUpDown ])
    ]);
  }),
  },
}).createMachine({
  context: ({}) => ({
    count: 0,
    messages: [],
    field : 0
  }),
  id: "root",
  initial: "Start",
  states: {
    Start: { after: { 1000: "Next" } },
    Next: {
      invoke : {
        src : "Attend",
        onDone : {
          target : "Go",
          actions: ({ event }) => console.log(event.output),
        } ,
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      }
    },
    Go : {
      invoke: {
        src : "LLMActor",
        input : ({}) => ({ prompt: [{ role: "user", content: initial_prompt }] }),
        onDone : {
          target : "Speak",
          actions : [
            assign(({context,event}) => {
              return {
                messages : [
                  ...context.messages,
                  {role : "user",
                  content : event.output.message.content,
                  }
                ]
              }
            }),
           ({context}) => console.log(context.messages)
          ]
        }
      }
    },
    Speak : {
      invoke: {
        src: "fhSpeakG",
        input: ({context}) => ({text :` ${context.messages[context.messages.length -1].content} `}),
        onDone: [ 
          {guard: ({context}) => context.field === 0 , target: "ListenField" },
          {target : "ListenAnswer",
          actions: ({ event }) => console.log(event.output)},
          ],
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    ListenField: {
      invoke: {
        src: "fhL",
        onDone: [
          {guard : ({context}) => context.messages[context.messages.length - 1].content.toLowerCase().includes("goodbye"), target : "Fail"},
          {guard :({event}) => event.output === "", target : "Repeat" },
          {target: "Recognise",
          actions: [({ event }) => console.log(event.output),
            assign(({context,event}) => {
              return {
                messages : [
                  ...context.messages,
                  {role : "user",
                  content : `The field the user is interesting in is ${event.output[1]}. If the user's answer isn't there repeat the question. 
                            As an interviewer please ask the user questions about their personal traits and soft skills but not technical skills about the field . 
                            Try to ask questions like "tell me a little bit about yourself","what is your strongest attribute", "tell me one time you worked in stress/in a team, one time you failed in a task,you had to persuade someone,where do you see yourself in 5 years etc. 
                            If the user asks to finish the conversation say goodbye and good luck.
                            If the user asks for help please give some guidelines.
                            Don't ask technical questions.
                            If the user changes the topic please remind them what you are doing. Don't forget to be brief. `,
                  }
                ]
              }
            }),
            assign(({context})=> {
              return {
                field : context.field +=1 
              }
            } ) ,
            ({context}) => console.log(context.messages)
        ]}],
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    Recognise : {
      invoke : {
        src : "fhNod",
        onDone : {
          target : "Generate"
        }
      }
  } ,
    ListenAnswer: {
      invoke: {
        src: "fhL",
        onDone: [
          {guard : ({context}) => context.messages[context.messages.length - 1].content.toLowerCase().includes("good luck"), target : "Fail"},
          {guard :({event}) => event.output[1] === "" , target : "Repeat" },
          {target: "Recognised",
          actions: [({ event }) => console.log(event.output),
            assign(({context,event}) => {
              return {
                messages : [
                  ...context.messages,
                  {role : "user",
                  content : `The answer was ${event.output[1]}. The user may not answer if they don't repeat the same question don't move to the next one.If they asked for help answering, give some guidelines.
                   If not please give briefly some feedback about how they responded and ask if they want to repeat their answer
                   if it was an indaquate answer or move on to the next question. 
                   If they ask to move on ask another question.
                   Ask follow up questions about what you learn but also change the question after some time.
                   If the user asks to finish the conversation say goodbye and good luck.`,
                  }
                ]
              }
            }),
            ({context}) => console.log(context.messages)
        ]}],
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    Recognised : {
        invoke : {
          src : "fhGesture",
          onDone : {
            target : "Generate"
          }
        }
    } ,
    Repeat : {
      invoke: {
        src: "ListenCarefully",
        onDone: {
          target: "Generate",
          actions: [
            assign(({ context, event }) => {
              return {
                messages: [
                  ...context.messages,
                  {
                    role: "system",
                    content: repeat,
                  },
                ],
              };
            }),
          ],
        },
      },
    },
    Generate: {
      invoke: {
        src: "LLMActor",
        input: ({context}) => ({ prompt: context.messages }),
        onDone: {
          target: "Speak",
          actions: [
            assign(({ context, event }) => {
              return {
                messages: [
                  ...context.messages,
                  {
                    role: "assistant",
                    content: event.output.message.content,
                  },
                ],
              };
            }),
          ],
        },
      },
    },
  Fail : {},
  },
});

const actor = createActor(dmMachine).start();
console.log(actor.getSnapshot().value);

actor.subscribe((snapshot) => {
  console.log(snapshot.value);
});
