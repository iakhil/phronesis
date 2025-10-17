"""
Pipecat Gemini Live Bot for Phronesis
Handles real-time voice conversations with Gemini Live API
"""

import argparse
import asyncio
import os
import sys

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.transports.services.daily import DailyParams, DailyTransport
from pipecat.services.google import GoogleLLMService, GoogleTTSService
from pipecat.audio.vad.silero import SileroVADAnalyzer

async def main(room_url: str, token: str, bot_type: str, topic: str, concept: str):
    print(f"Bot started for room: {room_url}, type: {bot_type}, topic: {topic}, concept: {concept}")

    # Configure system instruction based on bot type and topic
    system_instruction = ""
    if bot_type == "coding":
        system_instruction = f"""You are an AI Code Review Assistant for {topic} - {concept}.
Your role is to help the user understand and improve their Python code.
You can see the user's code, output, and errors.
Guide them through debugging, suggest optimizations, and explain concepts.
Keep responses concise and conversational.
"""
    elif bot_type == "quiz":
        system_instruction = f"""You are an AI Quiz Master for {topic}.
Your role is to ask questions, evaluate answers, and provide feedback.
Start by asking a question about {topic}.
At the end of the quiz, provide a textual summary of areas to improve or ace.
"""
    elif bot_type == "scroll":
        system_instruction = f"""You are an AI narrator for scroll content about {topic}.
Automatically start speaking about the content.
Allow the user to interrupt you at any time to ask questions or learn more.
"""
    else:  # general or learn mode
        system_instruction = f"""You are a friendly AI tutor for {topic}.
Start by giving a brief explanation of {concept if concept else topic}.
Then ask if the user has any questions.
Keep your responses concise and educational.
"""
    
    # Initialize Daily transport
    transport = DailyTransport(
        room_url,
        token,
        "Phronesis AI",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            camera_out_enabled=False,  # Disable video/camera
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )

    # Initialize Google Gemini LLM service
    try:
        llm = GoogleLLMService(
            api_key=os.getenv("GEMINI_API_KEY"),
            model="gemini-pro",  # Use stable Gemini Pro model
        )
    except Exception as e:
        print(f"Failed to initialize Google LLM: {e}")
        print("Falling back to echo bot for testing")
        # For now, we'll just echo back
        return

    # Initialize OpenAI-compatible context with system message
    context = OpenAILLMContext(
        messages=[
            {"role": "system", "content": system_instruction}
        ]
    )
    context_aggregator = llm.create_context_aggregator(context)

    # Assemble the pipeline
    pipeline = Pipeline([
        transport.input(),
        context_aggregator.user(),
        llm,
        context_aggregator.assistant(),
        transport.output(),
    ])

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    runner = PipelineRunner()
    await runner.run(task)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipecat Gemini Bot")
    parser.add_argument("-u", "--room-url", required=True, help="Daily room URL")
    parser.add_argument("-t", "--token", required=True, help="Daily meeting token")
    parser.add_argument("--bot-type", default="general", help="Type of bot (general, coding, quiz, scroll)")
    parser.add_argument("--topic", default="", help="Main topic for the bot")
    parser.add_argument("--concept", default="", help="Specific concept within the topic")
    args = parser.parse_args()

    asyncio.run(main(args.room_url, args.token, args.bot_type, args.topic, args.concept))
