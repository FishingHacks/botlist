class bot {
    constructor(name, description, id, website, votes, invite, ownerID, headline, tags, prefix, discordServer, avatar) {
        this.name = name;
        this.description = description;
        this.id = id;
        this.website = website;
        this.votes = votes;
        this.invite = invite;
        this.ownerID = ownerID;
        this.headline = headline;
        this.tags = tags;
        this.prefix = prefix;
        this.discordServer = discordServer;
        this.isReviewed = false;
        this.avatar = avatar;
    }

    review(value=true) {
        this.isReviewed = value;
        return this;
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description,
            id: this.id,
            website: this.website,
            votes: this.votes,
            invite: this.invite,
            ownerID: this.ownerID,
            headline: this.headline,
            tags: this.tags,
            prefix: this.prefix,
            discordServer: this.discordServer,
            isReviewed: this.isReviewed,
            avatar: this.avatar,
        }
    }
}

module.exports = {
    bot: bot,
    fromJSON: (JSON) => {
        const { name, description, id, website, votes, invite, ownerID, headline, tags, prefix, discordServer, isReviewed, avatar } = JSON;
        if (
          name != undefined &&
          description != undefined &&
          id != undefined &&
          website != undefined &&
          votes != undefined &&
          invite != undefined &&
          ownerID != undefined &&
          headline != undefined &&
          tags != undefined &&
          prefix != undefined &&
          discordServer != undefined &&
          isReviewed != undefined &&
          avatar != undefined
        ) {
          return new bot(
            name,
            description,
            id,
            website,
            votes,
            invite,
            ownerID,
            headline,
            tags,
            prefix,
            discordServer,
            avatar
          ).review(isReviewed);
        } else {
          return false;
        }
    }
};