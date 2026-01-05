import os, asyncio
from openai import AsyncAzureOpenAI
from dotenv import load_dotenv

load_dotenv()

print("AZURE_OPENAI_API_KEY =", os.getenv("AZURE_OPENAI_API_KEY"))
print("AZURE_OPENAI_ENDPOINT =", os.getenv("AZURE_OPENAI_ENDPOINT"))
print("AZURE_OPENAI_DEPLOYMENT_NAME =", os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"))

async def main():
    client = AsyncAzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION")
    )

    response = await client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello from Azure Foundry GPT-4o!'"}
        ]
    )
    print(response.choices[0].message.content)

asyncio.run(main())
