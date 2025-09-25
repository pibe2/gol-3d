set -ex

cd "$(dirname "$0")/.."

mkdir -p dist/
cp *.{js,html,css} dist/

ls -halt dist/

echo "Build Succeeded!"
