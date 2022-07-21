let chat = [],
  options = [],
  preview = {},
  temp_chat = [];

function openchat() {
  document.getElementById("chat-box-id").style.display = "block";
  document.getElementById("chat-circle").style.display = "none";
}

window.onload = () => {
  getData();
};

function closechat() {
  document.getElementById("chat-box-id").style.display = "none";
  document.getElementById("chat-circle").style.display = "block";
}

const displayData = async () => {
  const messagesContainer = document.getElementById("bot-message-container");
  const optionsContainer = document.getElementById("bot-option-container");
  chat?.map((data) => {
    messagesContainer.innerHTML += `<div  class="message-container  ${
      data?.from === "user" ? `justify-end` : `d-flex`
    }">
      <div class="bot-message-container ${
        data?.from === "user" ? "bot-user-message" : ""
      }">${messageText(data, "chat")}</div>
        </div>`;
  });
  if (options.length) {
    optionsContainer.innerHTML = `<span class="option-heading">CHOOSE AN OPTION</span><div class="d-flex" id="option-container"></div>`;
    const optionsDiv = document.getElementById("option-container");
    options?.map((data) => {
      optionsDiv.innerHTML += `<div class="bot-option-container" id="${
        data.id
      }" data-value='${JSON.stringify(
        data
      )}' onclick='handleSendResponse(event)'>
          ${messageText(data, "option")}
          </div>`;
    });
  } else {
    optionsContainer.innerHTML = "";
  }
  scrollToBottom();
};

const getData = async () => {
  axios
    .post(
      "https://chatbot-apis-dev.herokuapp.com/flow/v1/8c2ffc63-63d9-49e1-8a4d-b2b404b36a7c/preview"
    )
    .then((res) => {
      displayData(res?.data);
      setStartNode(res);
      preview = res;
    });
};

const sendHistory = () => {
  const sendData = {
    flow_id: chat[0]?.flow_id,
    chat: temp_chat,
  };
  axios.post(
    "https://chatbot-apis-dev.herokuapp.com/flow/v1/save_chat_history",
    sendData
  );
};

const setStartNode = (preview) => {
  const nodes = preview?.data?.nodes;
  const startNode = nodes?.filter((data) => data?.type === "special");
  const { ...tempData } = startNode[0]?.data?.nodeData[0];
  chat.push(tempData);
  options = startNode[0]?.data?.nodeData;
  displayData();
};

const messageText = (preview, type = "chat") => {
  switch (preview?.type) {
    case "chat":
      return preview?.text;

    case "button":
      return preview?.btn;

    case "special":
      if (type === "option") {
        return preview?.button;
      } else {
        return preview?.text;
      }

    case "text":
    case "number":
    case "phone":
    case "url":
    case "email":
    case "date":
      return `<div>
          <p>${preview?.text}</p>
          <form id=send   data-value='${JSON.stringify(preview)}'
                onsubmit="handleSendResponse(event)">
            <div class="input-group">
              <input
              class="form-control"
                id=${preview?.id}
                autocomplete="off"
                required
                type=${preview?.type}
                placeholder="Type here..."
              />
               <div class="input-group-append">
                <button
                type="submit"

                class="btn btn-primary"
                >
                <i class="fa fa-send"></i>
                </button>
               </div>
            </div>
          </form>
        </div>`;

    default:
      break;
  }
};

const handleSendResponse = (e) => {
  e.preventDefault();
  const dataValue = document.getElementById(e.target.id).dataset.value;
  const newData = JSON.parse(dataValue);
  checkUserMessageResponse(newData);
  chat = temp_chat;
  findeNextNode(newData?.id);
  chat = temp_chat;
  displayData();
  sendHistory();
};

const checkUserMessageResponse = (data) => {
  switch (data?.type) {
    case "special":
      temp_chat = [{ ...data, type: "chat", text: data?.button, from: "user" }];
      return temp_chat;

    case "text":
    case "number":
    case "phone":
    case "url":
    case "email":
    case "date":
      const value = document.getElementById(data?.id).value;
      const lastElement = document.getElementById("bot-message-container");
      lastElement.removeChild(lastElement.lastChild);
      temp_chat = [
        { ...data, type: "chat" },
        { ...data, type: "chat", text: value, from: "user" },
      ];
      return temp_chat;

    case "button":
      temp_chat = [{ ...data, from: "user" }];
      return temp_chat;

    default:
      break;
  }
};

const findeNextNode = (sourceId) => {
  options = [];
  const connections = preview?.data?.connections;
  const nodes = preview?.data?.nodes;
  const nextNodeId = connections.filter(
    (data) => data?.sourceHandle === sourceId
  );

  if (nextNodeId.length) {
    const nextNodeData = nodes.filter(
      (data) => data?.id === nextNodeId[0]?.target
    );
    if (nextNodeData[0]?.data?.nodeData[0]?.type !== "button") {
      temp_chat = [...temp_chat, { ...nextNodeData[0]?.data?.nodeData[0] }];
      if (nextNodeData[0]?.data?.nodeData[0]?.type === "chat") {
        findeNextNode(nextNodeData[0]?.data?.nodeData[0]?.id);
      }
    } else {
      const btnChat = nextNodeData[0]?.data?.nodeData.filter(
        (data) => data.type === "chat"
      );
      const optionBtn = nextNodeData[0]?.data?.nodeData.filter(
        (data) => data.type === "button"
      );
      temp_chat = [...temp_chat, { ...btnChat[0] }];
      chat = temp_chat;
      options = optionBtn;
    }
  }
};

function scrollToBottom() {
  element = document.getElementById("chat-box");
  element.scrollTop = element.scrollHeight;
}
