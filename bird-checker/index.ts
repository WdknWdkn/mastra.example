import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core';
import { z } from 'zod';

export type Image = {
  alt_description: string;
  urls: {
    regular: string;
    raw: string;
  };
  user: {
    first_name: string;
    links: {
      html: string;
    };
  };
};

export type ImageResponse<T, K> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: K;
    };

const getRandomImage = async ({ query }: { query: string }): Promise<ImageResponse<Image, string>> => {
  const page = Math.floor(Math.random() * 20);
  const order_by = Math.random() < 0.5 ? 'relevant' : 'latest';
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${query}&page=${page}&order_by=${order_by}`, {
      method: 'GET',
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        ok: false,
        error: 'Failed to fetch image',
      };
    }

    const data = (await res.json()) as {
      results: Array<Image>;
    };
    
    if (!data.results || data.results.length === 0) {
      return {
        ok: false,
        error: 'No images found',
      };
    }
    
    const randomNo = Math.floor(Math.random() * data.results.length);

    return {
      ok: true,
      data: data.results[randomNo] as Image,
    };
  } catch (err) {
    return {
      ok: false,
      error: 'Error fetching image',
    };
  }
};

const instructions = `
  You can view an image and figure out if it is a bird or not. 
  You can also figure out the species of the bird and where the picture was taken.
`;

// Create the bird checker agent with Anthropic's Claude model if API key is available
export const createBirdCheckerAgent = () => {
  // Check if Anthropic API key is available, otherwise use OpenAI
  if (process.env.ANTHROPIC_API_KEY) {
    return new Agent({
      name: 'Bird checker',
      instructions,
      model: anthropic('claude-3-haiku-20240307'),
    });
  } else {
    // Fallback to OpenAI
    return new Agent({
      name: 'Bird checker',
      instructions,
      model: openai('gpt-4-vision-preview'),
    });
  }
};

// Main function to run the example
export const runBirdChecker = async () => {
  const birdCheckerAgent = createBirdCheckerAgent();
  
  const queries: string[] = ['wildlife', 'feathers', 'flying', 'birds'];
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];

  // Get the image url from Unsplash with random type
  const imageResponse = await getRandomImage({ query: randomQuery });

  if (!imageResponse.ok) {
    console.log('Error fetching image', imageResponse.error);
    return { error: imageResponse.error };
  }

  console.log('Image URL: ', imageResponse.data.urls.regular);
  try {
    const response = await birdCheckerAgent.generate(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: new URL(imageResponse.data.urls.regular),
            },
            {
              type: 'text',
              text: "view this image and let me know if it's a bird or not, and the scientific name of the bird without any explanation. Also summarize the location for this picture in one or two short sentences understandable by a high school student",
            },
          ],
        },
      ],
      {
        output: z.object({
          bird: z.boolean(),
          species: z.string(),
          location: z.string(),
        }),
      },
    );

    console.log(response.object);
    return {
      result: response.object,
      imageUrl: imageResponse.data.urls.regular,
      imageCredit: {
        name: imageResponse.data.user.first_name,
        link: imageResponse.data.user.links.html,
      },
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { error: 'Error analyzing image' };
  }
};

// Run the example if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runBirdChecker().catch(console.error);
}
