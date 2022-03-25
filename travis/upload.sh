set -ev
echo TAG: $TRAVIS_TAG


zip -r WebIM-Demo-Vue.zip ./dist
curl -v -F r=releases -F hasPom=false -F e=zip -F g=com.easemob.chatdemo2 -F a=WebIM-Demo-Vue -F v=$TRAVIS_TAG -F p=zip -F file=@WebIM-Demo-Vue.zip -u ci-deploy:$EASEMOB_NEXUS_PASSWORD  https://hk.nexus.op.easemob.com/nexus/service/local/artifact/maven/content
