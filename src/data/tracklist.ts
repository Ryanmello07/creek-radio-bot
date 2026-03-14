export interface Track {
  song: string;
  artist: string;
  startSeconds: number;
}

function ts(h: number, m: number, s: number): number {
  return h * 3600 + m * 60 + s;
}

export const tracklist: Track[] = [
  { song: 'Paranoid', artist: 'Black Sabbath', startSeconds: ts(0, 0, 20) },
  { song: 'Barracuda', artist: 'Heart', startSeconds: ts(0, 3, 19) },
  { song: 'Mississippi Queen', artist: 'Mountain', startSeconds: ts(0, 7, 49) },
  { song: 'Immigration Song', artist: 'Led Zeppelin', startSeconds: ts(0, 11, 24) },
  { song: 'Highway Tune', artist: 'Greta Van Fleet', startSeconds: ts(0, 13, 45) },
  { song: 'Fortunate Son', artist: 'Creedence Clearwater Revival', startSeconds: ts(0, 18, 29) },
  { song: 'Paint It, Black', artist: 'The Rolling Stones', startSeconds: ts(0, 20, 41) },
  { song: 'Gimme Shelter', artist: 'The Rolling Stones', startSeconds: ts(0, 24, 20) },
  { song: 'Kashmir', artist: 'Led Zeppelin', startSeconds: ts(0, 30, 38) },
  { song: 'All Along The Watchtower', artist: 'Jimi Hendrix', startSeconds: ts(0, 39, 16) },
  { song: 'Voodoo Child (Slight Return)', artist: 'Jimi Hendrix', startSeconds: ts(0, 43, 15) },
  { song: 'Money For Nothing', artist: 'Dire Straits', startSeconds: ts(0, 51, 44) },
  { song: 'War Pig', artist: 'Black Sabbath', startSeconds: ts(0, 58, 24) },
  { song: 'Carry On My Wayward Son', artist: 'Kansas', startSeconds: ts(1, 6, 18) },
  { song: 'Thunderstruck', artist: 'AC/DC', startSeconds: ts(1, 13, 7) },
  { song: 'Master Of Puppets', artist: 'Metallica', startSeconds: ts(1, 17, 57) },
  { song: 'Holy Diver', artist: 'Dio', startSeconds: ts(1, 26, 28) },
  { song: 'Spirit In The Sky', artist: 'Norman Greenbaum', startSeconds: ts(1, 31, 42) },
  { song: 'Welcome To The Jungle', artist: 'Guns \'N Roses', startSeconds: ts(1, 36, 10) },
  { song: 'Crazy Train', artist: 'Ozzy Osbourne', startSeconds: ts(1, 40, 30) },
  { song: 'Back In Black', artist: 'AC/DC', startSeconds: ts(1, 44, 10) },
  { song: 'Renegade', artist: 'Styx', startSeconds: ts(1, 48, 15) },
  { song: 'Sabotage', artist: 'Beastie Boys', startSeconds: ts(1, 52, 19) },
  { song: 'Kickstart My Heart', artist: 'Motley Crue', startSeconds: ts(1, 55, 29) },
  { song: 'Rock You Like a Hurricane', artist: 'Scorpions', startSeconds: ts(2, 0, 17) },
  { song: 'Cherry Bomb', artist: 'The Runaways', startSeconds: ts(2, 4, 45) },
  { song: 'Funk #49', artist: 'James Gang', startSeconds: ts(2, 7, 2) },
  { song: 'War (What Is It Good For)', artist: 'Edwin Starr', startSeconds: ts(2, 12, 9) },
  { song: 'Sympathy for the Devil', artist: 'The Rolling Stones', startSeconds: ts(2, 15, 49) },
  { song: 'Run Through the Jungle', artist: 'Creedence Clearwater Revival', startSeconds: ts(2, 21, 52) },
  { song: 'Helter Skelter', artist: 'Motley Crue', startSeconds: ts(2, 26, 36) },
  { song: 'Highway to Hell', artist: 'AC/DC', startSeconds: ts(2, 29, 40) },
  { song: 'Lights Out', artist: 'UFO', startSeconds: ts(2, 33, 7) },
  { song: 'Cult of Personality', artist: 'Living Colour', startSeconds: ts(2, 40, 12) },
  { song: 'Land of Confusion', artist: 'Genesis', startSeconds: ts(2, 45, 1) },
  { song: 'Never Let Me Down Again', artist: 'Depeche Mode', startSeconds: ts(2, 49, 40) },
  { song: 'The Stroke', artist: 'Billy Squier', startSeconds: ts(2, 57, 19) },
  { song: 'Black Dog', artist: 'Led Zeppelin', startSeconds: ts(3, 1, 1) },
  { song: 'Magic Carpet Ride', artist: 'Steppenwolf', startSeconds: ts(3, 5, 45) },
  { song: 'For Whom the Bell Tolls', artist: 'Metallica', startSeconds: ts(3, 11, 39) },
  { song: 'Electric Eye', artist: 'Judas Priest', startSeconds: ts(3, 16, 41) },
  { song: 'The Mob Rules', artist: 'Black Sabbath', startSeconds: ts(3, 21, 13) },
  { song: 'Civil War', artist: 'Guns N\' Roses', startSeconds: ts(3, 25, 14) },
  { song: 'Running with the Devil', artist: 'Van Halen', startSeconds: ts(3, 32, 49) },
  { song: 'Baba O\'Riley', artist: 'The Who', startSeconds: ts(3, 36, 16) },
  { song: 'Riders on the Storm', artist: 'The Doors', startSeconds: ts(3, 44, 49) },
  { song: 'Oats in the Water', artist: 'Ben Howard', startSeconds: ts(3, 51, 20) },
  { song: 'The Man Comes Around', artist: 'Johnny Cash', startSeconds: ts(3, 56, 13) },
  { song: 'Black Betty', artist: 'Ram Jam', startSeconds: ts(4, 1, 47) },
  { song: 'Rebel Yell', artist: 'Billy Idol', startSeconds: ts(4, 4, 16) },
  { song: 'How You Like Me Now?', artist: 'The Heavy', startSeconds: ts(4, 9, 3) },
  { song: 'Mother', artist: 'Danzig', startSeconds: ts(4, 14, 20) },
  { song: 'Bad Company', artist: 'Bad Company', startSeconds: ts(4, 17, 53) },
  { song: 'Enter Sandman', artist: 'Metallica', startSeconds: ts(4, 22, 17) },
  { song: 'The Chain', artist: 'Fleetwood Mac', startSeconds: ts(4, 28, 27) },
  { song: 'Hellraiser', artist: 'Ozzy Osbourne', startSeconds: ts(4, 32, 45) },
  { song: 'Don\'t Fear The Reaper', artist: 'Blue Oyster Cult', startSeconds: ts(4, 37, 42) },
  { song: 'Iron Man', artist: 'Black Sabbath', startSeconds: ts(4, 44, 57) },
  { song: 'Strutter', artist: 'Kiss', startSeconds: ts(4, 50, 57) },
  { song: 'Pour Some Sugar On Me', artist: 'Def Leppard', startSeconds: ts(4, 54, 5) },
  { song: 'Eminence Front', artist: 'The Who', startSeconds: ts(5, 0, 13) },
  { song: 'Juke Box Hero', artist: 'Foreigner', startSeconds: ts(5, 6, 9) },
  { song: 'Sharp Dressed Man', artist: 'ZZ Top', startSeconds: ts(5, 10, 38) },
  { song: 'South of Heaven', artist: 'Slayer', startSeconds: ts(5, 17, 31) },
  { song: 'Crazy On You', artist: 'Heart', startSeconds: ts(5, 22, 4) },
  { song: 'Free Bird', artist: 'Lynyrd Skynyrd', startSeconds: ts(5, 29, 1) },
  { song: 'Born To Be Wild', artist: 'Steppenwolf', startSeconds: ts(5, 41, 31) },
  { song: 'Shout at the Devil', artist: 'Motley Crue', startSeconds: ts(5, 45, 14) },
  { song: 'No Sleep Till Brooklyn', artist: 'Beastie Boys', startSeconds: ts(5, 48, 25) },
  { song: 'Come And Get Your Love', artist: 'Redbone', startSeconds: ts(5, 53, 51) },
  { song: 'Superstition', artist: 'Stevie Wonder', startSeconds: ts(5, 57, 14) },
  { song: 'Play That Funky Music', artist: 'Wild Cherry', startSeconds: ts(6, 1, 53) },
];

export interface CurrentTrackInfo {
  track: Track;
  index: number;
  elapsed: number;
  nextTrack: Track | null;
}

export function getCurrentTrack(positionSeconds: number): CurrentTrackInfo | null {
  if (tracklist.length === 0) return null;

  let idx = 0;
  for (let i = tracklist.length - 1; i >= 0; i--) {
    if (positionSeconds >= tracklist[i].startSeconds) {
      idx = i;
      break;
    }
  }

  return {
    track: tracklist[idx],
    index: idx,
    elapsed: positionSeconds - tracklist[idx].startSeconds,
    nextTrack: idx + 1 < tracklist.length ? tracklist[idx + 1] : null,
  };
}
