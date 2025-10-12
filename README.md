# 🧠 Phronesis - Multi-Modal AI Learning Platform

## What is this?
Phronesis is a learning platform for students or anyone who is keen to learn about a new subject. LLMs have a lot of information, but it is difficult to retrieve this information in a way that enhances our learning. That's why I built Phronesis. Users can study popular CS topics like Data Structures and Operating Systsems by talking to an AI voice agent in real time. Once they have learnt and clarified their doubts, they can switch to Quiz mode and have the voice agent conduct a quiz to test the user's understanding. After the quiz, the user gets a report on their knowledge gaps so that they can fill that. Infinitely scrollable feeds are very popular. Phronesis has a Scroll tab where users can scroll infinitely from a variety of subjects and then converse with the influencer to discuss the topic in more depth.

## How I used Gemini and Pipecat
-Used Gemini for generating educational content. 
-Used gemini-2.5-flash-preview and the live API for conducting live conversations.
-Gemini powers the code solutions and checks for correctness.
-Pipecat is used for handling the voice pipeline and using webRTC. It supports better voice activity detection, meaning when a user interrupts the agent. 

## What I did during the hackathon?
I built almost everything from scratch. Prior to the hackathon, I just had a scafolding of the project. I implemented the voice APIs today.


## Feedback
For some reason, Pipecat was very difficult to integrate with Gemini. Specifically, it was not clear which API is to be used since the daily.co dashboard had 4 APIs. Gemini's voice API is good, but it sounds scratchy and has a cracking background noise. Its ability to detect interuptions is still not the best.