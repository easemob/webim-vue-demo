set -ev
echo TAG: $TRAVIS_TAG

echo -e "\n[is a tag] start packing\n"
TRAVIS=true TAG_NAME=$TRAVIS_TAG npm run build
pwd 
sed -i "s/{#version}/${TRAVIS_TAG}/g"  ./dist/index.html