import isValidString from "../../utils/validators/isValidString";

interface SendNotificationOptions {
  type?: "success" | "error";
  channel?: "console" | "snackbar";
}

const sendNotification = (
  message: string,
  options: SendNotificationOptions = { type: "success", channel: "console" }
) => {
  if (options.channel === "console") {
    console.log(
      `${options.type === "success" ? "SUCCESS" : "ERROR"}: ${
        isValidString(message) ? message : "unknown error"
      }`
    );
  }
};

export const sendSuccessNotification = (message: string) => {
  sendNotification(message, { type: "success" });
};

export const sendErrorNotification = (message: string) => {
  sendNotification(message, { type: "error" });
};

export default sendNotification;
