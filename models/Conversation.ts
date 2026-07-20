import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const MessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
);

const ConversationSchema = new Schema(
  {
    title: {
      type: String,
      default: "New conversation",
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export type ConversationDocument = InferSchemaType<typeof ConversationSchema>;

export const Conversation =
  (models.Conversation as mongoose.Model<ConversationDocument>) ??
  model<ConversationDocument>("Conversation", ConversationSchema);
