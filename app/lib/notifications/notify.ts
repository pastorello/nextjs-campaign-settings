"use client";

import { toast } from "sonner";

/**
 * Tells the user something happened (TD-10).
 *
 * **This replaces half of `sendNotification`, and the split is the point.** That
 * function took a `channel` of `"console" | "snackbar"`, implemented only
 * `console`, and was called from both server and client code. On the server a
 * "notification" reached the terminal and the user saw nothing at all — an
 * invalid login logged `ERROR: CredentialsSignin` where nobody was looking.
 *
 * Two audiences, two functions now: this one is for the person using the app
 * and only runs in the browser. Diagnostics for whoever is running the server
 * go through `logServerIssue`, which does not pretend to be a notification.
 */
export const notifySuccess = (message: string): void => {
  toast.success(message);
};

export const notifyError = (message: string): void => {
  toast.error(message);
};
