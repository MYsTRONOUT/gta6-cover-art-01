// Fixed scenes for screenshots: ?shot=editor shows the editor with a photo loaded;
// ?shot=cover, ?shot=cover1350 and ?shot=coversquare show an exported cover on its own.
// The query may override size, layout, grade, caption and subtitle; the photos are the
// bundled samples, so every scene is reproducible offline.

async function paintScene(app, scene) {
  const pier = await app.loadSample('pier');
  const boulevard = await app.loadSample('boulevard');
  const photos = scene.photos ?? [pier, boulevard, boulevard, pier];
  const crops = scene.crops ?? [];
  for (let i = 0; i < 4; i += 1) {
    app.state.panels[i].img = photos[i % photos.length];
    const crop = crops[i] ?? {};
    app.state.panels[i].zoom = crop.zoom ?? 1;
    app.state.panels[i].ox = crop.ox ?? 0;
    app.state.panels[i].oy = crop.oy ?? 0;
  }
  app.setLayout(scene.layout);
  app.setSize(scene.size);
  app.setGrade(scene.grade);
  app.state.title = scene.title;
  app.state.subtitle = scene.subtitle;
  document.getElementById('title').value = scene.title;
  document.getElementById('subtitle').value = scene.subtitle;
  app.redraw();
}

export async function runShot(shot, query, app) {
  const title = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'One last score';
  const grade = query.get('grade') ?? 'sunset';
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await paintScene(app, {
      layout: Number(query.get('layout') ?? 4),
      size: query.get('size') ?? '1920x1080',
      grade,
      title,
      subtitle,
      crops: [{}, {}, { zoom: 1.3, ox: 0.06, oy: -0.05 }, { zoom: 1.15, ox: -0.05 }],
    });
    return;
  }
  if (shot === 'cover1350') {
    document.body.classList.add('shot-cover');
    await paintScene(app, {
      layout: 3,
      size: '1080x1350',
      grade: 'neon',
      title: query.get('caption') ?? 'Boulevard Queen',
      subtitle: query.get('subtitle') ?? 'Neon nights',
      crops: [{}, {}, { zoom: 1.35, ox: -0.08 }],
    });
    return;
  }
  if (shot === 'coversquare') {
    document.body.classList.add('shot-cover');
    await paintScene(app, {
      layout: 2,
      size: '1080x1080',
      grade: 'sunset',
      title: query.get('caption') ?? 'Midnight Drive',
      subtitle: query.get('subtitle') ?? 'One last score',
    });
    return;
  }
  await paintScene(app, {
    layout: 4,
    size: '1080x1080',
    grade: 'sunset',
    title,
    subtitle,
  });
}
