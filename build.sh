# Copy the built css into the includes directory so that it can be used in the
# amp pages
cp public/css/*.css _includes/

# Amp doesn't like the !important css attribute that pure css uses, so we
# remove it!
gsed -i -e 's/!important//g' _includes/*.css

# pure contains IE7 specific hacks to get a style to reset using a syntax error.
# This is not needed for AMP, so we'll remove it from the css. See stackoverflow
# for more information https://stackoverflow.com/q/1690642/433785
gsed -i -e 's/*display:inline;//g' _includes/*.css


# Create AMP version of head tags too
cp _includes/head.html _includes/amp-head.html
gsed -i -e 's/meta name="viewport"//g' _includes/amp-head.html
gsed -i -e 's/< content="width//g' _includes/amp-head.html
