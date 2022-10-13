param ($msg, $version="minor")
$projects = @('quimica', 'biologia', 'fisica')

npm.cmd run build
git add --all
git commit -m $msg
npm version $version

git push origin
foreach($proj in $projects){
    git push $proj
}