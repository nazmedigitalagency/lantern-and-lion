// Scripture Connections — the puzzle bank. Pure content, no game logic.
// Adding puzzle #9, #90, or #900 later is editing this array; nothing
// about `engine.ts` or `page.tsx` needs to change.

import type { PuzzleDefinition } from './engine';

function puzzle(
  id: string,
  title: string,
  ageGroup: PuzzleDefinition['ageGroup'],
  difficulty: PuzzleDefinition['difficulty'],
  xpReward: number,
  groups: [string, string[], string][],
): PuzzleDefinition {
  return {
    id,
    title,
    ageGroup,
    difficulty,
    xpReward,
    maxMistakes: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 4 : 3,
    skills: ['pattern-recognition', 'vocabulary', 'memory', 'bible-knowledge', 'critical-thinking'],
    groups: groups.map(([category, items, explanation], i) => ({ id: `${id}-g${i}`, category, items, explanation })),
  };
}

export const PUZZLE_BANK: PuzzleDefinition[] = [
  puzzle('noahs-flood', 'Noah’s Flood', 'kids', 'easy', 60, [
    ['Noah’s Flood', ['NOAH', 'ARK', 'RAIN', 'DOVE'], 'These are all connected to the story of Noah’s flood in Genesis 6-9.'],
    ['The First Christmas', ['MARY', 'JOSEPH', 'STAR', 'MANGER'], 'These are all part of the story of Jesus’ birth in Bethlehem.'],
  ]),
  puzzle('good-shepherd', 'Sheep and Shepherds', 'kids', 'easy', 60, [
    ['The Lost Sheep', ['SHEPHERD', 'SHEEP', 'LOST', 'FOUND'], 'These come from Jesus’ parable of the shepherd who searches for one lost sheep (Luke 15).'],
    ['David the Shepherd Boy', ['DAVID', 'HARP', 'FIELD', 'FLOCK'], 'These describe David’s life as a shepherd before he became king.'],
  ]),
  puzzle('heroes-and-stories', 'Bible Heroes & Their Stories', 'tweens', 'medium', 80, [
    ['David and Goliath', ['DAVID', 'SLING', 'GOLIATH', 'STONE'], 'These are all associated with David’s encounter with Goliath in 1 Samuel 17.'],
    ['Daniel’s Faith', ['DANIEL', 'LIONS', 'PRAYER', 'DEN'], 'These describe Daniel’s faithfulness even when thrown into the lions’ den (Daniel 6).'],
    ['The Exodus', ['MOSES', 'PHARAOH', 'PLAGUES', 'DESERT'], 'These are key elements of Israel’s exodus from Egypt (Exodus 1-14).'],
  ]),
  puzzle('women-of-faith', 'Women of Faith', 'tweens', 'medium', 80, [
    ['Esther Saves Her People', ['ESTHER', 'KING', 'BANQUET', 'MORDECAI'], 'These are central to Esther’s courageous rescue of her people (Esther 2-7).'],
    ['Ruth’s Loyalty', ['RUTH', 'NAOMI', 'BARLEY', 'BOAZ'], 'These are part of Ruth’s story of loyalty and provision (Ruth 1-4).'],
    ['Mary’s Obedience', ['MARY', 'ANGEL', 'GABRIEL', 'NAZARETH'], 'These describe the announcement of Jesus’ birth to Mary (Luke 1:26-38).'],
  ]),
  puzzle('kings-prophets-places', 'Kings, Prophets, and Places', 'tweens', 'hard', 100, [
    ['Israel’s Kings', ['SAUL', 'DAVID', 'SOLOMON', 'JEROBOAM'], 'These were all kings who ruled over Israel.'],
    ['Major Prophets', ['ISAIAH', 'JEREMIAH', 'EZEKIEL', 'DANIEL'], 'These are traditionally known as the major prophets of the Old Testament.'],
    ['Cities of the Bible', ['JERICHO', 'BETHLEHEM', 'NAZARETH', 'CAPERNAUM'], 'These are all cities that appear throughout the biblical narrative.'],
    ['New Testament Apostles', ['PETER', 'JOHN', 'ANDREW', 'PHILIP'], 'These were among the twelve apostles Jesus called.'],
  ]),
  puzzle('parables-and-miracles', 'Parables and Miracles', 'teens', 'hard', 100, [
    ['Jesus’ Parables', ['SOWER', 'PRODIGAL', 'TALENTS', 'VINEYARD'], 'These are titles or central images from parables Jesus told.'],
    ['Jesus’ Miracles', ['LOAVES', 'LAZARUS', 'BLIND', 'STORM'], 'These are all connected to miracles Jesus performed.'],
    ['Old Testament Judges', ['DEBORAH', 'GIDEON', 'SAMSON', 'EHUD'], 'These were judges who led Israel before the time of the kings.'],
    ['Instruments of Worship', ['HARP', 'LYRE', 'CYMBALS', 'TRUMPET'], 'These instruments are named in the Psalms as used for worship.'],
  ]),
  puzzle('exile-and-ministry', 'Exile, Ministry, and Meaning', 'teens', 'expert', 130, [
    ['Characters Who Experienced Exile', ['DANIEL', 'EZEKIEL', 'ESTHER', 'NEHEMIAH'], 'Each of these lived during Israel’s exile in Babylon or Persia.'],
    ['Places of Paul’s Ministry', ['EPHESUS', 'CORINTH', 'PHILIPPI', 'ATHENS'], 'Paul preached, planted churches, or wrote letters to believers in each of these cities.'],
    ['Fruit of the Spirit', ['LOVE', 'JOY', 'PEACE', 'PATIENCE'], 'These are named among the fruit of the Spirit in Galatians 5:22-23.'],
    ['Words for God’s Faithfulness', ['COVENANT', 'MERCY', 'STEADFAST', 'GRACE'], 'These words describe how Scripture speaks of God keeping His promises.'],
  ]),
  puzzle('wisdom-and-wilderness', 'Wisdom and Wilderness', 'teens', 'expert', 130, [
    ['Wisdom Literature', ['PROVERBS', 'ECCLESIASTES', 'PSALMS', 'JOB'], 'These Old Testament books are grouped together as wisdom literature.'],
    ['Wilderness Wanderings', ['MANNA', 'QUAIL', 'PILLAR', 'TABERNACLE'], 'These all relate to Israel’s forty years wandering in the wilderness.'],
    ['Titles for Jesus', ['SHEPHERD', 'LAMB', 'LIGHT', 'VINE'], 'These are images or titles Scripture uses to describe Jesus.'],
    ['Armor of God', ['SHIELD', 'HELMET', 'BREASTPLATE', 'SWORD'], 'These are named as pieces of the armor of God in Ephesians 6:10-17.'],
  ]),
  puzzle('theology-in-focus', 'Theology in Focus', 'teens', 'expert', 130, [
    ['Names for the Holy Spirit', ['COMFORTER', 'ADVOCATE', 'COUNSELOR', 'HELPER'], 'These are all titles Scripture uses for the Holy Spirit, especially in Jesus’ teaching in John 14-16.'],
    ['Witnesses of the Resurrection', ['MARY MAGDALENE', 'THOMAS', 'CLEOPAS', 'PETER'], 'Each of these is named in the Gospels as a witness to the risen Jesus.'],
    ['Early Church Leaders', ['STEPHEN', 'BARNABAS', 'TIMOTHY', 'PRISCILLA'], 'These were leaders and co-workers in the early church described in Acts and the Epistles.'],
    ['Attributes of God', ['OMNISCIENT', 'IMMUTABLE', 'SOVEREIGN', 'HOLY'], 'These are theological terms describing God’s unchanging nature and character.'],
  ]),
];

export function getPuzzleDefinition(id: string): PuzzleDefinition | undefined {
  return PUZZLE_BANK.find((p) => p.id === id);
}
