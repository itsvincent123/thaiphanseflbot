const ytdl = require('ytdl-core');
const spotifyUrlInfo = require('spotify-url-info')(fetch)
const ytsr = require('ytsr'); // YouTube search module
const strings = require("../strings.json");
const utils = require("../utils");

module.exports.run = async (client, message, args) => {
    if(!args[0]) return message.channel.send(strings.noArgsSongSearch);

    utils.log("Looking for music details...")

    let FUrl;
    if(utils.isURL(args[0])){
        FUrl = args[0];
    } else {
        FUrl = await utils.getUrl(args)
    };

    let voiceChannel = message.member.voice.channel; 
    const serverQueue = queue.get("queue");
    let songInfo;
    try {
        if (FUrl.includes('spotify')) {
            const spotifyInfo = await spotifyUrlInfo.getDetails(FUrl);
            console.log(spotifyInfo)
            console.log(`
            Title: ${spotifyInfo.preview.title}\n
            Artist: ${spotifyInfo.preview.artist}\n`)
            const youtubeResults = await ytsr(spotifyInfo.preview.title + ' ' + spotifyInfo.preview.artist, { limit: 1 });
            FUrl = youtubeResults.items[0].url;
        }
        songInfo = await ytdl.getBasicInfo(FUrl);
        // console.log(songInfo)
    } catch (error) {
        console.log(error)
        return message.channel.send("The provided URL is not a valid YouTube or Spotify URL.\nNOTE: If you want to use Spotify URLs, make sure to use the Spotify URL of a song, not a playlist.");
    }

    const song = {
        title: songInfo.videoDetails.title,
        duration: songInfo.videoDetails.durationSec,
        url: FUrl,
        requestedby: message.author.username
    };

    utils.log("Got music details, preparing the music to be played...")
    
    if(!serverQueue || !serverQueue.songs) {

        const queueConstruct = {
            textchannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 1,
            playing: true,
            loop: false,
            skipped: false
        };

        queue.set("queue", queueConstruct);
        queueConstruct.songs.push(song);

        if (voiceChannel != null) { 

            message.channel.send(strings.startedPlaying.replace("SONG_TITLE", song.title).replace("url", song.url));
            
            const connection = utils.joinVChannel(voiceChannel);

            queueConstruct.connection = connection;

            utils.play(queueConstruct.songs[0]);

        } else {
            queue.delete("queue");
            return message.channel.send(strings.notInVocal);
        };
    } else {

        serverQueue.songs.push(song);
        utils.log(`Added music to the queue : ${song.title}`)

        return message.channel.send(strings.songAddedToQueue.replace("SONG_TITLE", song.title).replace("url", song.url));
    };

};

module.exports.names = {
    list: ["play", "p"]
};