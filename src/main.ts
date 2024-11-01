import { text } from "stream/consumers";
import { setup, createActor, fromPromise, assign } from "xstate";

const FURHATURI =  "192.168.1.11:54321" // "127.0.0.1:54321";

async function getRandomFromList(list: string[]): Promise<string> {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

function getRandomFunction(funcs: (() => Promise<any>)[]): Promise<any> {
  const randomIndex = Math.floor(Math.random() * funcs.length);
  return funcs[randomIndex]();
}
const listen_gestures = ['Nod', 'Smile', 'Thoughtful']

const initial_prompt = `
You are an interview coach helping the user prepare for an upcoming interview. 
Please, be brief when talking. You need to explain your purpose. You need to first ask the user what field of employment they are interested in.
Please ask the user questions about their personal traits and soft skills but not technical skills . 
Try to ask questions like "tell me a little bit about yourself","what is your strongest attribute", "tell me one time you worked in stress/in a team, one time you failed in a task,you had to persuade someone,where do you see yourself in 5 years etc. 
If the user asks for help please give some guidelines in a few words.
If the user changes the topic please remind them what you are doing. Don't forget to be brief.` ;


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
    body: JSON.stringify({
      "frames": [
        {
          "time": [1.0, 1.2],
          "persist": true, }  ]})
  });
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
        temperature : 0.3
      };
      return fetch("http://localhost:11434/api/chat", {
        method: "POST",
        body: JSON.stringify(body),
      }).then((response) => response.json());
   } ), 
    fhHello: fromPromise<any, null>(async () => {
      return fhSay("Hi");
    }),
    Attend : fromPromise<any, null>(async () => {
      return fhGetUser(); 
    }) ,
    fhL: fromPromise<any, null>(async () => {
     return Promise.all([
      fhAttend() ,
      fhListen(),
      fhSound("https://furhat-audio.s3.eu-north-1.amazonaws.com/110853-Male_mouth_makes_tch_tch_tch_sound_effect-Nightingale_Music_Productions-12655.wav"),
      
     ])
   }),
   ListenCarefully: fromPromise<any, null>(async () => {
    return ListeningCarefully();
   }),
   fhGesture : fromPromise<any,any>(async () => {
   return getRandomFunction([() => getRandomFromList(listen_gestures), ListeningCarefully]);
   }),
   fhSound : fromPromise<any, null> (async () => {
    return fromPromise.call([
      fhGesture('Shake'),
      fhSound("https://furhat-audio.s3.eu-north-1.amazonaws.com/110853-Male_mouth_makes_tch_tch_tch_sound_effect-Nightingale_Music_Productions-12655.wav"),
      fhAttend()
    ])
  }), 
   fhSpeakG: fromPromise<any, { text: string}>(async ({ input }) => {
    return Promise.all([
      fhAttend() ,
      fhSay(input.text),
    ]);
  }),
  },
}).createMachine({
  context: ({}) => ({
    count: 0,
    messages: [],
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
        onDone: {
          target : "ListenAnswer",
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          target: "Fail",
          actions: ({ event }) => console.error(event),
        },
      },
    },
    ListenAnswer: {
      invoke: {
        src: "fhL",
        onDone: {
          target: "Recognised",
          actions: [({ event }) => console.log(event.output),
            assign(({context,event}) => {
              return {
                messages : [
                  ...context.messages,
                  {role : "user",
                  content : `The answer was ${event.output[1]}. If they asked for help answering, give some guidelines. If not please give briefly some feedback about their response and ask if they want to repeat their answer if it was an indaquate answer or move on to the next question. If they ask to move on ask another question.If the user doesn't answer repeat the question. Don't forget to ask follow up questions about what you learn.`,
                  }
                ]
              }
            }),
            ({context}) => console.log(context.messages)
        ]},
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
    Fail: {},
  },
});

const actor = createActor(dmMachine).start();
console.log(actor.getSnapshot().value);

actor.subscribe((snapshot) => {
  console.log(snapshot.value);
});
