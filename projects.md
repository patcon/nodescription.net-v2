---
layout: page
title: Projects
permalink: /projects/
---
{% for project in site.projects %}
  [{{ project.title }}]({{ project.url }})
{% endfor %}

<iframe
  src='https://cdn.knightlab.com/libs/timeline3/latest/embed/index.html?source={{ site.timelinejs.gsheet_id }}&font=Default&lang=en&initial_zoom=2&height=650'
  width='100%'
  height='650'
  frameborder='0'>
</iframe>
