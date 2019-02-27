const fetch = require("node-fetch");
var exports = module.exports = {};

const videoCategories = {
    Music: '🎵',
    Gaming: '🎮',
    Other: '📺'
}

exports.isGettingVideoInfo = false;

exports.getVideoInfo = async function (videoId) {
    exports.isGettingVideoInfo = true;
    var ytr = { title: null, uploader: null, likes: null, dislikes: null, views: null, category: null }
    await fetch(`https://www.youtube.com/watch?pbj=1&v=${videoId}`, {
        headers: {
            'x-youtube-client-name': '1',
            'x-youtube-client-version': '2.20180905'
        }
    })
        .then(function (response) {
        	result = response.json()
        	//console.log(response)
            return result;
        })
        .then(function (jsd) {
            ytr.title = jsd[2].player.args.title
            ytr.uploader = jsd[2].player.args.author
            try{
                ytr.likes = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.sentimentBar.sentimentBarRenderer.tooltip.split(' / ')[0]
                ytr.dislikes = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.sentimentBar.sentimentBarRenderer.tooltip.split(' / ')[1]  
            }
            catch(e) {
            	ytr.likes = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[1].videoPrimaryInfoRenderer.sentimentBar.sentimentBarRenderer.tooltip.split(' / ')[0]
            	ytr.dislikes = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[1].videoPrimaryInfoRenderer.sentimentBar.sentimentBarRenderer.tooltip.split(' / ')[1] 
            }
            //Check if is Youtube Original
            try{
                if (typeof jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.badges != 'undefined' && jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.badges){//If it's Youtube Original : No view count
                    ytr.views = ''
            	}
            }
            catch(e){
            	try{
                    ytr.views = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.split(' ')[0]
            	}
            	catch(e) {
                    ytr.views = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[1].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.split(' ')[0]
            	}
            }
            try {
                ytr.category = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.metadataRowContainer.metadataRowContainerRenderer.rows[1].metadataRowRenderer.contents[0].runs[0].text
            } catch (e) {
            	try{
                    ytr.category = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.metadataRowContainer.metadataRowContainerRenderer.rows[0].metadataRowRenderer.contents[0].runs[0].text
            } catch (e) {//Requires another try if there is a shop in the description
                    ytr.category = jsd[3].response.contents.twoColumnWatchNextResults.results.results.contents[2].videoSecondaryInfoRenderer.metadataRowContainer.metadataRowContainerRenderer.rows[0].metadataRowRenderer.contents[0].runs[0].text              
            }
        }
     });

    exports.isGettingVideoInfo = false;
    return ytr;
}

exports.getCategoryIcon = function (name) {
    var icon = videoCategories[name];
    if (!icon) return videoCategories.Other;
    return icon;
}
