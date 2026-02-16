import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const projects = await getCollection('projects');

  const events = projects
    .sort((a, b) => {
      const aKey = `${a.data.start_date.year}-${String(a.data.start_date.month ?? 0).padStart(2, '0')}`;
      const bKey = `${b.data.start_date.year}-${String(b.data.start_date.month ?? 0).padStart(2, '0')}`;
      return aKey.localeCompare(bKey);
    })
    .map((project) => {
      const { data, body } = project;

      const event: Record<string, unknown> = {
        start_date: {
          year: data.start_date.year,
          ...(data.start_date.month && { month: data.start_date.month }),
          ...(data.start_date.day && { day: data.start_date.day }),
        },
        text: {
          headline: `<a href="/projects/${project.id}/">${data.title}</a>`,
          text: body || '',
        },
      };

      if (data.end_date) {
        event.end_date = {
          year: data.end_date.year,
          ...(data.end_date.month && { month: data.end_date.month }),
          ...(data.end_date.day && { day: data.end_date.day }),
        };
      }

      if (data.media_url) {
        event.media = {
          url: data.media_url,
          ...(data.media_credit && { credit: data.media_credit }),
          ...(data.media_caption && { caption: data.media_caption }),
          ...(data.media_thumbnail && { thumbnail: data.media_thumbnail }),
        };
      }

      if (data.group) {
        event.group = data.group;
      }

      if (data.background) {
        event.background = { url: data.background };
      }

      return event;
    });

  const timeline = {
    title: {
      text: {
        headline: 'Project Timeline',
        text: 'This is a summary of both my code and <span style="background:#737373;color:white;padding:0 5px">life</span> projects.',
      },
    },
    events,
  };

  return new Response(JSON.stringify(timeline), {
    headers: { 'Content-Type': 'application/json' },
  });
};
